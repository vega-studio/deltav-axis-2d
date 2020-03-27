import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import { Vec2 } from "deltav";
import { Bucket } from "./bucket";

export interface INumberAxisStoreOptions extends IBasicAxisStoreOptions {
  numberRange: Vec2;
  numberGap?: number;
  decimalLength?: number;
}

export class NumberAxisStore extends BasicAxisStore {
  higherInterval: number = 2;
  preInterval: number = 1;
  numberRange: Vec2;
  numberGap: number;
  decimalLength: number;

  constructor(options: INumberAxisStoreOptions) {
    super(options);
  }

  initIndexRange(options: INumberAxisStoreOptions) {
    this.numberRange = options.numberRange;
    this.numberGap = options.numberGap || 1;
    this.decimalLength = options.decimalLength || 3;
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
  }

  getPreSetWidth() {
    const startString = this.numberRange[0].toFixed(this.decimalLength);
    const endString = this.numberRange[1].toFixed(this.decimalLength);
    return Math.max(startString.length, endString.length) * this.labelSize / 2;
  }

  getPreSetHeight() {
    return this.labelSize;
  }

  getMainLabel(index: number): string {
    const number = this.numberRange[0] + index * this.numberGap;
    if (number % 1 !== 0) return number.toFixed(this.decimalLength);
    return number.toString();
  }

  getSubLabel(): string {
    return "";
  }

  layoutHorizon() {
    const {
      higherInterval,
      interval,
      lowerInterval,
      maxLabelWidth,
      preSetMaxWidth,
      scale,
      unitWidth,
      view
    } = this;

    const origin = view.origin;
    const curScale = 0.5 * Math.pow(2, scale);
    const maxBucketWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;
    const lowerScale = maxBucketWidth / (unitWidth * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketWidth / (unitWidth * interval * 0.5) :
      maxBucketWidth / (unitWidth * lowerInterval);
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
    const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
    const start = Math.ceil(this.indexRange[0] / interval) * interval;
    const end = Math.floor(this.indexRange[1] / interval) * interval;
    const unitW = unitWidth * curScale;

    for (let i = start; i <= end; i += interval) {
      let labelAlpha = alpha < 0.5 ? alpha * 2 : 1.0;
      const x = origin[0] + (i + 0.5) * unitW + this.offset;
      if (i % higherInterval === 0) labelAlpha = 1;
      this.setBucket(i, [x, origin[1]], labelAlpha);
    }
  }

  layoutVertical() {
    const {
      higherInterval,
      interval,
      lowerInterval,
      maxLabelHeight,
      preSetMaxHeight,
      scale,
      unitHeight,
      view
    } = this;

    const curScale = 0.5 * Math.pow(2, scale);
    const maxBucketHeight = maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;
    const lowerScale = maxBucketHeight / (unitHeight * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketHeight / (unitHeight * interval * 0.5) :
      maxBucketHeight / (unitHeight * lowerInterval);
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
    const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
    const unitH = unitHeight * curScale;
    const origin = view.origin;
    const start = Math.ceil(this.indexRange[0] / interval) * interval;
    const end = Math.floor(this.indexRange[1] / interval) * interval;

    for (let i = start; i <= end; i += interval) {
      let labelAlpha = alpha < 0.5 ? alpha * 2 : 1.0;
      const y = origin[1] - (i + 0.5) * unitH - this.offset;
      if (i % higherInterval === 0) labelAlpha = 1;
      this.setBucket(i, [origin[0], y], labelAlpha);
    }
  }

  posToDomain(pos: number): string {
    const numberRange = this.numberRange;
    const maxRange = this.maxRange;
    const posScale = (pos - maxRange[0]) / (maxRange[1] - maxRange[0]);
    return `${(posScale * (numberRange[1] - numberRange[0]) + numberRange[0]).toFixed(this.decimalLength)}`;
  }

  removeBuckets(start: number, end: number) {
    const interval = this.preInterval;
    const s = Math.ceil(start / interval) * interval;
    const e = Math.floor(end / interval) * interval;

    for (let i = s; i <= e; i += interval) {
      if (this.bucketMap.has(i)) {
        const bucket = this.bucketMap.get(i);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }

        if (bucket.showTick) {
          bucket.showTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  removeBucketsAtLowerLevels(start: number, end: number) {
    if (this.preInterval < this.interval) {
      this.removeBuckets(start, end);
    }
  }

  setBucket(index: number, position: Vec2, alpha: number) {
    const {
      labelPadding,
    } = this;

    const labelAlpha = alpha > 0.4 ? (alpha - 0.4) * 5 / 3 : 0;
    const tickAlpha = alpha;

    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] &&
      window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.mainLabel) {
          bucket.updateMainLabel(position, labelAlpha, labelPadding, this.verticalLayout);
        }

        if (bucket.tick) {
          bucket.updateTick(position, tickAlpha, this.verticalLayout);
        }

        if (!bucket.showLabels) {
          bucket.showLabels = true;
          this.providers.labels.add(bucket.mainLabel);
        }

        if (!bucket.showTick) {
          bucket.showTick = true;
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const text = this.getMainLabel(index);
        const bucket: Bucket = new Bucket({
          labelColor: this.labelColor,
          labelFontSize: this.labelSize,
          tickLength: this.tickLength,
          tickWidth: this.tickWidth
        })

        bucket.createMainLabel(
          text, position, alpha, labelPadding, this.verticalLayout, this.onLabelReady
        )

        bucket.createTick(position, alpha, this.verticalLayout);
        this.bucketMap.set(index, bucket);
        this.providers.labels.add(bucket.mainLabel);
        this.providers.ticks.add(bucket.tick);

      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          this.providers.labels.remove(bucket.mainLabel);
        }

        if (bucket.showTick) {
          bucket.showTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  setRange(start: number, end: number) {
    this.numberRange = [start, end];
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.maxLabelWidth = 0;
    this.maxLabelHeight = 0;
    this.removeAll();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  updateInterval() {
    this.preInterval = this.interval;
    const curScale = 0.5 * Math.pow(2, this.scale);
    const unit = (this.verticalLayout ? this.unitHeight : this.unitWidth) * curScale;
    const maxValue = this.verticalLayout ?
      this.maxLabelHeight === 0 ? this.preSetMaxHeight : this.maxLabelHeight :
      this.maxLabelWidth === 0 ? this.preSetMaxWidth : this.maxLabelWidth;

    if (this.interval * unit < maxValue) {
      while (this.interval * unit < maxValue) {
        this.interval *= 2;
        this.lowerInterval = this.interval / 2;
      }
    } else {
      while (
        this.lowerInterval * unit >= maxValue &&
        this.interval * unit >= maxValue
      ) {
        this.interval /= 2;
        this.lowerInterval = this.interval === 1 ? 0 : this.interval / 2;
      }
    }

    this.higherInterval = this.interval * 2;
  }
}
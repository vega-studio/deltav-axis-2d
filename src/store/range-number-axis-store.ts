import { NumberAxisStore, INumberAxisStoreOptions } from "./number-axis-store";
import { Vec2 } from "deltav";
import { Bucket } from "./bucket";

export class RangeNumberAxisStore<T extends number> extends NumberAxisStore<number> {

  bucketLevelMap: Map<number, Map<number, Bucket>>;

  initIndexRange(options: INumberAxisStoreOptions<T>) {
    this.numberRange = options.numberRange;
    this.numberGap = options.numberGap || 1;
    this.childrenNumber = options.childrenNumber || 2;
    this.decimalLength = options.decimalLength || -1;
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
    this.unitWidth = this.view.size[0] / (this.unitNumber - 1);
    this.unitHeight = this.view.size[1] / (this.unitNumber - 1);
    this.indexRange = [0, this.unitNumber - 1];
    this.generateIntervalLengths();
    this.bucketLevelMap = new Map<number, Map<number, Bucket>>();

    for (let i = 0; i < this.intervalLengths.length; i++) {
      this.bucketLevelMap.set(i, new Map<number, Bucket>());
    }
  }

  getMaxLevel() {
    let maxLevel = 0;
    console.warn("unit width", this.unitWidth)

    if (this.intervalLengths.length > 0) {
      let interval = this.intervalLengths[maxLevel];

      while (
        maxLevel < this.intervalLengths.length &&
        interval * this.unitWidth <= this.maxLabelWidth
      ) {
        maxLevel++;
        interval = this.intervalLengths[maxLevel];
      }

      if (maxLevel === this.intervalLengths.length) maxLevel--;
    }

    return maxLevel;
  }

  /*getMainLabel(index: number, level?: number) {
    const interval = this.intervalLengths[level];
    const number = this.numberRange[0] + index * interval * this.numberGap;
    if (number % 1 !== 0 && this.decimalLength !== -1) return number.toFixed(this.decimalLength);
    return number.toString();
  }*/

  layoutBuckets() {
    const curScale = this.transformScale();
    const alphas = this.getAlphas();
    let labelAlpha = alphas.labelAlpha;
    const tickAlpha = alphas.tickAlpha;
    const origin = this.view.origin;
    const maxLevel = this.getMaxLevel();

    this.labelScaleLevel = Math.min(maxLevel, this.labelScaleLevel);

    const tickIndices = this.getIndices(
      this.indexRange[0],
      this.indexRange[1],
      this.labelScaleLevel
    );

    console.warn("tick indices", tickIndices, this.indexRange);
    console.warn("maxLevel", maxLevel, "label Scale", this.labelScaleLevel);

    const interval = this.intervalLengths[this.labelScaleLevel];
    const intWidth = interval * this.unitWidth;

    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i];
      const level = this.getIndexLevel(index);
      if (level === maxLevel || level > this.labelScaleLevel) labelAlpha = 1;
      // const alpha = tickAlpha;
      const pos: Vec2 = this.verticalLayout ?
        [origin[0], origin[1] - index * this.unitHeight * curScale - this.offset] :
        [origin[0] + index * this.unitWidth * curScale + this.offset, origin[1]];
      // this.setBucket(this.labelScaleLevel, index, pos, labelAlpha);
      this.setLabel(index, pos, labelAlpha);
      this.setTick(index, pos, labelAlpha);
    }

    /* const labelIndices = this.getIndices(this.indexRange[0], this.indexRange[1], this.labelScaleLevel, maxLevel);
 
     for (let i = 0; i < labelIndices.length; i++) {
       const index = labelIndices[i];
       const level = this.getIndexLevel(index);
       const alpha = level >= this.labelScaleLevel + 1 ? 1 : labelAlpha;
       const pos: Vec2 = this.verticalLayout ?
         [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
         [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];
       
     }*/
  }

  setBucket(level: number, index: number, position: Vec2, alpha: number) {
    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    const levelMap = this.bucketLevelMap.get(level);

    if (levelMap) {
      if (inViewRange) {
        if (levelMap.has(index)) {
          const bucket = levelMap.get(index);

          if (bucket.tick) {
            bucket.updateTick(position, alpha, this.verticalLayout);
          } else {
            bucket.createTick(position, alpha, this.verticalLayout);
          }

          if (!bucket.showTick) {
            bucket.showTick = true;
            this.providers.ticks.add(bucket.tick);
          }

          if (bucket.mainLabel) {
            bucket.updateMainLabel(position, alpha, this.labelPadding, this.verticalLayout);
          } else {
            const text = this.getMainLabel(index);
            bucket.createMainLabel(text, position, alpha, this.labelPadding, this.verticalLayout, this.onLabelReady);
          }

          if (!bucket.showLabels) {
            bucket.showLabels = true;
            this.providers.labels.add(bucket.mainLabel);
          }


        } else {
          const bucket: Bucket = new Bucket({
            labelColor: this.labelColor,
            labelFontSize: this.labelFontSize,
            tickColor: this.tickColor,
            tickLength: this.tickLength,
            tickWidth: this.tickWidth,
            onMainLabelInstance: this.mainLabelHandler,
            onSubLabelInstance: this.subLabelHandler,
            onTickInstance: this.tickHandler
          })


          bucket.createTick(position, alpha, this.verticalLayout);
          const text = this.getMainLabel(index);
          bucket.createMainLabel(
            text,
            position,
            alpha,
            this.labelPadding,
            this.verticalLayout,
            this.onLabelReady
          );

          levelMap.set(index, bucket);
          this.providers.ticks.add(bucket.tick);
          this.providers.labels.add(bucket.mainLabel);
        }
      } else {
        if (levelMap.has(index)) {
          const bucket = levelMap.get(index);

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

  }

  /*getIndices(start: number, end: number, level: number) {
    const indices: number[] = [];
    const interval = this.intervalLengths[level];
    start = Math.floor(start / interval) * interval;
    end = Math.floor(end / interval) * interval;

    for (let i = start; i <= end; i += interval) {
      indices.push(i / interval);
    }

    return indices;
  }*/

  /*getAlphas() {
    const curScale = this.transformScale();
    const maxLevel = this.getMaxLevel();
    this.labelScaleLevel = Math.min(maxLevel, this.labelScaleLevel);
    const interval = this.intervalLengths[this.labelScaleLevel];
    let alpha = 1;

    if (this.labelScaleLevel === maxLevel) {
      const lowerInterval = this.intervalLengths[this.labelScaleLevel - 1];
      const higherScale = this.maxLabelWidth / (lowerInterval * this.unitWidth);
      const lowerScale = 0.9 * higherScale; // this.maxBarWidth / (interval * this.unitWidth);
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      alpha = 1 - (alphaScale - lowerScale) / (higherScale - lowerScale);
    } else if (this.labelScaleLevel === 0) {
      const lowerScale = this.maxLabelWidth / (interval * this.unitWidth);
      const higherScale = 1.1 * lowerScale;
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
    } else {
      const lowerInterval = this.intervalLengths[this.labelScaleLevel - 1];
      const higherScale = this.maxLabelWidth / (lowerInterval * this.unitWidth);
      const lowerScale = this.maxLabelWidth / (interval * this.unitWidth);
      const scaleOffset = (higherScale - lowerScale) / 5;
      // part1
      if (curScale >= lowerScale && curScale <= lowerScale + scaleOffset) {
        alpha = (curScale - lowerScale) / scaleOffset;
      } else if (curScale >= higherScale - scaleOffset && curScale <= higherScale) {
        alpha = (higherScale - curScale) / scaleOffset;
      } else {
        alpha = 1;
      }
    }

    return {
      tickAlpha: alpha,
      labelAlpha: alpha
    }

  }*/

  updateIndexRange() {
    const curScale = this.transformScale();
    const unit = this.verticalLayout ? this.unitHeight * curScale : this.unitWidth * curScale;
    const start = Math.floor((this.viewRange[0] - this.maxRange[0]) / unit);
    const end = Math.ceil((this.viewRange[1] - this.maxRange[0]) / unit);
    const oldStart = this.indexRange[0];
    const oldEnd = this.indexRange[1];

    if (oldEnd < start || oldStart > end) {
      this.removeBuckets(oldStart, oldEnd);
    } else {
      if (oldEnd >= start && oldStart < start) {
        this.removeBuckets(oldStart, start);
      }

      if (oldStart <= end && oldEnd > end) {
        this.removeBuckets(end, oldEnd);
      }
    }

    if (this.preLabelScaleLevel < this.labelScaleLevel) {
      // const indices = this.getIndices(start, end, this.preLabelScaleLevel);
      this.removeBuckets(start, end);
    }
    this.indexRange = [start, end];
  }

  removeBuckets(start: number, end: number) {
    const indices = this.getIndices(start, end, this.preLabelScaleLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }

        if (bucket.showTick) {
          bucket.showTick = false;
          if (bucket.tick) this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

}
import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import moment from "moment";
import { getSimpleIntervalLengths, getSimpleIndices, getSimpleMomentLevel } from "src/util/dateUtil";
import { Vec2 } from "deltav";
import { Bucket } from "./bucket";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface IDateAxisStoreOptions extends IBasicAxisStoreOptions {
  startDate?: Date | string;
  endDate?: Date | string;
}

export class DateAxisStore extends BasicAxisStore {
  startDate: Date;
  endDate: Date;
  totalYears: number;
  labelScaleLevel: number;
  preLabelScaleLevel: number;
  tickScaleLevel: number;
  preTickScaleLevel: number;

  labelIntervalLengths: number[];
  tickIntervalLengths: number[];

  constructor(options: IDateAxisStoreOptions) {
    super(options);
  }

  getMainLabel(index: number): string {
    const startDate = this.startDate;
    const currentDate = moment(startDate).add(index, 'milliseconds').toDate();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const second = currentDate.getSeconds();
    const ms = currentDate.getMilliseconds();

    if (month === 0 && day === 1 && hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${year}`;
    } else if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${monthNames[month]} ${day}`
    } else if (ms === 0) {
      return `${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;
    }

    return `${ms} ms`;
  }

  getSubLabel(index: number): string {
    const startDate = this.startDate;
    const currentDate = moment(startDate).add(index, 'milliseconds').toDate();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const second = currentDate.getSeconds();
    const ms = currentDate.getMilliseconds();

    if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${year}`
    } else if (ms === 0) {
      return `${monthNames[month]} ${day}`
    }

    return `${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;

  }

  getPreSetWidth(): number {
    return 4 * this.labelSize;
  }

  getPreSetHeight(): number {
    return this.labelSize;
  }

  generateDateInterval() {
    this.tickIntervalLengths = getSimpleIntervalLengths(this.startDate, this.endDate);
    this.labelIntervalLengths = getSimpleIntervalLengths(this.startDate, this.endDate);
    let level = Math.floor(Math.log2(this.totalYears));
    let daysInAYearTick = this.tickIntervalLengths[this.tickIntervalLengths.length - 1];
    let daysInAYearLabel = this.labelIntervalLengths[this.labelIntervalLengths.length - 1];

    while (level > 0) {
      daysInAYearTick *= 2;
      daysInAYearLabel *= 2;
      this.tickIntervalLengths.push(daysInAYearTick);
      this.labelIntervalLengths.push(daysInAYearLabel);
      level--;
    }
  }

  initIndexRange(options: IDateAxisStoreOptions) {
    const startDate = options.startDate;
    const endDate = options.endDate;
    this.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
    this.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
    this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'milliseconds') + 1;
    this.totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;

    if (this.startDate.getMonth() == 0 && this.startDate.getDate() === 1) {
      this.totalYears += 1;
    }

    this.generateDateInterval();
    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
  }

  layoutHorizon() {
    const {
      interval,
      lowerInterval,
      maxLabelWidth,
      preSetMaxWidth,
      scale,
      unitWidth,
      view
    } = this;

    const curScale = 0.5 * Math.pow(2, scale);
    const maxBucketWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

    // LabelScale
    const labelBucketWidth = maxBucketWidth;
    const labelLowerScale = labelBucketWidth / (unitWidth * interval);
    const labelHigherScale = Math.min(
      10 * labelLowerScale,
      maxBucketWidth / (unitWidth * lowerInterval)
    );
    const labelAlphaScale = Math.min(Math.max(curScale, labelLowerScale), labelHigherScale);
    const labelAlpha = (labelAlphaScale - labelLowerScale) / (labelHigherScale - labelLowerScale);

    const tickAlpha = this.labelScaleLevel === 0 ? 1 : labelAlpha;

    const unitW = unitWidth * curScale;
    const origin = view.origin;
    const sd = moment(this.startDate).add(this.indexRange[0], 'milliseconds').toDate();
    const ed = moment(this.startDate).add(this.indexRange[1], 'milliseconds').toDate();
    const maxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 12;

    const tickIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.tickScaleLevel, maxLevel);

    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);
      const x = origin[0] + (index + 0.5) * unitW + this.offset;
      let alpha = tickAlpha;
      if (level >= this.tickScaleLevel + 1) alpha = 1;
      this.setDateTick(index, [x, origin[1]], alpha);
    }

    const labelIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.labelScaleLevel, maxLevel);

    for (let i = 0; i < labelIndices.length; i++) {
      const index = labelIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);
      const x = origin[0] + (index + 0.5) * unitW + this.offset;
      let alpha = labelAlpha;
      if (level >= this.labelScaleLevel + 1) alpha = 1;
      this.setDateLabel(index, [x, origin[1]], alpha);
    }
  }

  layoutVertical() {
    const {
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

    // LabelScale
    const labelBucketWidth = maxBucketHeight;
    const labelLowerScale = labelBucketWidth / (unitHeight * interval);
    const labelHigherScale = Math.min(
      10 * labelLowerScale,
      maxBucketHeight / (unitHeight * lowerInterval)
    );
    const labelAlphaScale = Math.min(Math.max(curScale, labelLowerScale), labelHigherScale);
    const labelAlpha = (labelAlphaScale - labelLowerScale) / (labelHigherScale - labelLowerScale);
    const tickAlpha = this.labelScaleLevel === 0 ? 1 : labelAlpha;

    const unitH = unitHeight * curScale;
    const origin = view.origin;
    const sd = moment(this.startDate).add(this.indexRange[0], 'milliseconds').toDate();
    const ed = moment(this.startDate).add(this.indexRange[1], 'milliseconds').toDate();
    const maxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 12;

    const tickIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.tickScaleLevel, maxLevel);

    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);
      const y = origin[1] - (index + 0.5) * unitH - this.offset;
      let alpha = tickAlpha;
      if (level >= this.tickScaleLevel + 1) alpha = 1;
      this.setDateTick(index, [origin[0], y], alpha);
    }

    const labelIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.labelScaleLevel, maxLevel);

    for (let i = 0; i < labelIndices.length; i++) {
      const index = labelIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);
      const y = origin[1] - (index + 0.5) * unitH - this.offset;
      let alpha = labelAlpha;
      if (level >= this.labelScaleLevel + 1) alpha = 1;
      this.setDateLabel(index, [origin[0], y], alpha);
    }

  }

  posToDomain(pos: number): string {
    const maxRange = this.maxRange;
    pos = Math.min(Math.max(pos, maxRange[0]), maxRange[1]);
    const curScale = 0.5 * Math.pow(2, this.scale);
    const unit = curScale * (this.verticalLayout ? this.unitHeight : this.unitWidth);
    let index = Math.floor((pos - maxRange[0]) / unit);
    const time = moment(this.startDate).add(index, 'milliseconds').toDate();

    return moment(time).format("MMM DD YYYY, kk:mm:ss");
  }

  removeBuckets(start: number, end: number) {
    const maxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 12;
    this.removeDateLabels(start, end, this.preLabelScaleLevel, maxLevel);
    this.removeDateTicks(start, end, this.preTickScaleLevel, maxLevel);
  }

  removeBucketsAtLowerLevels(start: number, end: number) {
    this.removeDateTicks(start, end, this.tickScaleLevel - 2, this.tickScaleLevel - 1);
    this.removeDateLabels(start, end, this.labelScaleLevel - 2, this.labelScaleLevel - 1);
  }

  removeDateBuckets(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const startMoment = moment(this.startDate).add(start, 'milliseconds').toDate();
    const endMoment = moment(this.startDate).add(end, 'milliseconds').toDate();
    const indices = getSimpleIndices(this.startDate, this.totalYears, startMoment, endMoment, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }

        if (bucket.showTick) {
          bucket.showTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }

    }
  }

  removeDateTicks(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const startMoment = moment(this.startDate).add(start, 'milliseconds').toDate();
    const endMoment = moment(this.startDate).add(end, 'milliseconds').toDate();
    const indices = getSimpleIndices(this.startDate, this.totalYears, startMoment, endMoment, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showTick) {
          bucket.showTick = false;
          if (bucket.tick) this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  removeDateLabels(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const startMoment = moment(this.startDate).add(start, 'milliseconds').toDate();
    const endMoment = moment(this.startDate).add(end, 'milliseconds').toDate();
    const indices = getSimpleIndices(this.startDate, this.totalYears, startMoment, endMoment, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }
      }
    }
  }

  setDateTick(index: number, position: Vec2, alpha: number) {
    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];


    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.tick) {
          bucket.updateTick(position, alpha, this.verticalLayout);
        } else {
          bucket.createTick(position, alpha, this.verticalLayout);
        }

        if (!bucket.showTick) {
          bucket.showTick = true;
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const bucket: Bucket = new Bucket({
          labelColor: this.labelColor,
          labelFontSize: this.labelSize,
          tickLength: this.tickLength,
          tickWidth: this.tickWidth
        })

        bucket.showLabels = false;
        bucket.createTick(position, alpha, this.verticalLayout);
        this.bucketMap.set(index, bucket);
        this.providers.ticks.add(bucket.tick);
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showTick) {
          bucket.showTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  setDateLabel(index: number, position: Vec2, alpha: number) {
    const {
      labelPadding,
      labelSize
    } = this;

    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    const day = moment(this.startDate).add(index, 'milliseconds').toDate();
    const startMoment = new Date(day);
    startMoment.setMonth(0, 1);
    startMoment.setHours(0, 0, 0, 0);
    const atStartMoment = moment(day).isSame(startMoment);

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.mainLabel) {
          bucket.updateMainLabel(position, alpha, labelPadding, this.verticalLayout);
        } else {
          const text = this.getMainLabel(index);
          bucket.createMainLabel(text, position, alpha, labelPadding, this.verticalLayout, this.onLabelReady);
        }

        if (bucket.subLabel) {
          bucket.updateSubLabel(position, alpha, labelPadding + labelSize, this.verticalLayout);
        } else if (!atStartMoment) {
          const text = this.getSubLabel(index);
          bucket.createSubLabel(text, position, alpha, labelPadding + labelSize, this.verticalLayout)
        }

        if (!bucket.showLabels) {
          bucket.showLabels = true;
          this.providers.labels.add(bucket.mainLabel);
          if (bucket.subLabel && !this.verticalLayout) this.providers.labels.add(bucket.subLabel);
        }
      } else {
        const bucket: Bucket = new Bucket({
          labelColor: this.labelColor,
          labelFontSize: this.labelSize,
          tickLength: this.tickLength,
          tickWidth: this.tickWidth
        })

        const text = this.getMainLabel(index);
        bucket.createMainLabel(text, position, alpha, labelPadding, this.verticalLayout, this.onLabelReady);

        if (
          !this.verticalLayout &&
          !atStartMoment
        ) {
          bucket.createSubLabel(text, position, alpha, labelPadding + labelSize, this.verticalLayout);
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.mainLabel);
          this.providers.labels.add(bucket.subLabel);
        } else {
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.mainLabel);
        }
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }
      }
    }
  }

  setRange(startDate: string | Date, endDate: string | Date) {
    // Update start and end date
    this.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
    this.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
    this.totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();

    if (
      this.startDate.getMonth() == 0 &&
      this.startDate.getDate() === 1 &&
      this.startDate.getHours() === 0 &&
      this.startDate.getMinutes() === 0 &&
      this.startDate.getSeconds() === 0 &&
      this.startDate.getMilliseconds() === 0
    ) {
      this.totalYears += 1;
    }

    // Update unit number and related
    this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'milliseconds') + 1;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.maxLabelWidth = 0;
    this.maxLabelHeight = 0;
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  updateInterval() {
    this.preTickScaleLevel = this.tickScaleLevel;
    this.preLabelScaleLevel = this.labelScaleLevel;

    this.interval = this.labelIntervalLengths[this.labelScaleLevel];
    this.lowerInterval = this.labelScaleLevel === 0 ?
      0 : this.labelIntervalLengths[this.labelScaleLevel - 1];
    const curScale = 0.5 * Math.pow(2, this.scale);
    const unit = (this.verticalLayout ? this.unitHeight : this.unitWidth) * curScale;
    const maxValue = this.verticalLayout ?
      this.maxLabelHeight > 0 ? this.maxLabelHeight : this.preSetMaxHeight :
      this.maxLabelWidth > 0 ? this.maxLabelWidth : this.preSetMaxWidth;

    if (this.interval * unit < maxValue) {
      while (this.interval * unit < maxValue) {
        this.labelScaleLevel++;
        this.interval = this.labelIntervalLengths[this.labelScaleLevel];
        this.lowerInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
      }
    } else {
      while (this.lowerInterval * unit > maxValue && this.interval * unit >= maxValue) {
        this.labelScaleLevel--;
        this.interval = this.labelIntervalLengths[this.labelScaleLevel];
        this.lowerInterval = this.labelScaleLevel === 0 ?
          0 : this.labelIntervalLengths[this.labelScaleLevel - 1];
      }
    }

    this.tickScaleLevel = Math.max(this.labelScaleLevel - 1, 0);
  }
}
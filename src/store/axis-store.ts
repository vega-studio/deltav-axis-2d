import { InstanceProvider, EdgeInstance, LabelInstance, Color, AnchorType } from "deltav";
import { AxisDataType, Vec2, Vec3, Bucket } from "src/types";
import { dateLevel, travelDates, getDayLevel, getIntervalLengths, getIndices } from "src/util/dateUtil";
import moment from 'moment';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface IAxisStoreOptions {
  view: {
    origin: Vec2;
    size: Vec2;
  };
  providers?: {
    ticks?: InstanceProvider<EdgeInstance>,
    labels?: InstanceProvider<LabelInstance>
  };
  labelColor?: Color;
  labelSize?: number;
  labelHighlightColor?: Color;
  labelPadding?: number;
  tickWidth?: number;
  tickLength?: number;
  type: AxisDataType;
  labels?: string[];
  startDate?: Date | string;
  endDate?: Date | string
  numberRange?: Vec2;
  numberGap?: number;
  verticalLayout?: boolean;
}

export class AxisStore {
  // Layout mode
  verticalLayout: boolean = true;
  axisChanged: boolean = false;

  // data type
  type: AxisDataType;

  // Shape Instances Holders
  labelInstances: LabelInstance[] = [];
  tickLineInstances: EdgeInstance[] = [];

  // Axis Metrics
  view: {
    origin: Vec2;
    size: Vec2;
  }

  tickWidth: number = 1;
  tickLength: number = 10;

  // Label Metrics
  labelSize: number = 12;
  labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  labelPadding: number = 10;
  maxLabelWidth: number = 0;
  maxLabelHeight: number = 0;
  preSetMaxWidth: number = 0;
  preSetMaxHeight: number = 0;
  maxLabelLengh: number = 15;

  labels: string[];
  // Range
  maxRange: Vec2;
  viewRange: Vec2;
  numberRange: Vec2 = [0, 100];
  numberGap: number = 1;

  dates: dateLevel[]; ///
  startDate: Date = new Date(2000, 0, 1);
  endDate: Date = new Date();
  totalYears: number;
  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;
  offset: number = 0;
  scale: number = 1;

  // Interval info
  interval: number = 1;
  lowerInterval: number = 0;
  higherInterval: number = 2;
  preInterval: number = 1;

  scaleLevel: number = 0;
  preScaleLevel: number = 0;
  indexRange: Vec2 = [-1, -1];
  dateIntervalLengths: number[];
  bucketMap: Map<number, Bucket> = new Map<number, Bucket>();
  auxLines: EdgeInstance[] = [];
  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.view = options.view;
    this.preSetMaxWidth = this.view.size[0] / 20;
    this.preSetMaxHeight = options.labelSize || this.labelSize;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.verticalLayout = options.verticalLayout === undefined ? this.verticalLayout : options.verticalLayout;
    Object.assign(this.providers, options.providers);
    this.initType(options);
    this.init();
  }





  drawAuxilaryLines() {
    const origin = this.view.origin;
    const size = this.view.size;

    if (this.auxLines.length === 0) {
      if (this.verticalLayout) {
        const line1 = new EdgeInstance({
          start: origin,
          end: [origin[0] - 40, origin[1]],
          startColor: [1, 0, 0, 1],
          endColor: [1, 0, 0, 1]
        })
        const line2 = new EdgeInstance({
          start: [origin[0], origin[1] - size[1]],
          end: [origin[0] - 40, origin[1] - size[1]],
          startColor: [1, 0, 0, 1],
          endColor: [1, 0, 0, 1]
        })

        this.providers.ticks.add(line1);
        this.providers.ticks.add(line2);
      } else {
        const line1 = new EdgeInstance({
          start: origin,
          end: [origin[0], origin[1] - 40],
          startColor: [1, 0, 0, 1],
          endColor: [1, 0, 0, 1]
        })
        const line2 = new EdgeInstance({
          start: [origin[0] + size[0], origin[1]],
          end: [origin[0] + size[0], origin[1] - 40],
          startColor: [1, 0, 0, 1],
          endColor: [1, 0, 0, 1]
        })

        this.providers.ticks.add(line1);
        this.providers.ticks.add(line2);
      }
    } else {
      if (this.verticalLayout) {
        this.auxLines[0].start = origin;
        this.auxLines[0].end = [origin[0] - 40, origin[1]];
        this.auxLines[1].start = [origin[0], origin[1] - size[1]];
        this.auxLines[1].end = [origin[0] - 40, origin[1] - size[1]];
      } else {
        this.auxLines[0].start = origin;
        this.auxLines[0].end = [origin[0], origin[1] - 40];
        this.auxLines[1].start = [origin[0] + size[0], origin[1]];
        this.auxLines[1].end = [origin[0] + size[0], origin[1] - 40];
      }
    }
  }

  init() {
    this.initChartMetrics();
    this.updateInterval();

    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
    }

    this.drawAuxilaryLines();
  }

  initType(options: IAxisStoreOptions) {
    this.type = options.type;

    switch (this.type) {
      case AxisDataType.LABEL:
        if (!options.labels) {
          console.error("With type LABEL, labels must be set.");
          return;
        }

        this.labels = options.labels;
        this.unitNumber = this.labels.length;
        break;
      case AxisDataType.NUMBER:
        if (!options.numberRange) {
          console.error("With type NUMBER, numberRange must be be set.");
          return;
        }

        this.numberRange = options.numberRange;
        this.numberGap = options.numberGap;
        this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
        break;
      case AxisDataType.DATE:
        if (!options.startDate || !options.endDate) {
          console.error("With type DATE, both startDate and endDate must be be set.");
          return;
        }

        const startDate = options.startDate;
        const endDate = options.endDate;
        this.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
        this.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
        this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'days') + 1;
        this.totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();

        if (this.startDate.getMonth() == 0 && this.startDate.getDate() === 1) {
          this.totalYears += 1;
        }

        this.generateDateInterval();
    }

    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
  }

  initChartMetrics() {
    const origin = this.view.origin;
    const width = this.view.size[0];
    const height = this.view.size[1];

    if (this.verticalLayout) {
      this.viewRange = [
        window.innerHeight - origin[1],
        window.innerHeight - origin[1] + height
      ];
    } else {
      this.viewRange = [origin[0], origin[0] + width];
    }

    this.maxRange = this.viewRange;
    this.scale = 1;
    this.offset = this.maxRange[0] - this.viewRange[0];
  }

  generateDateInterval() {
    this.dateIntervalLengths = getIntervalLengths(this.startDate, this.endDate);

    let level = Math.floor(Math.log2(this.totalYears));
    let daysInAYear = this.dateIntervalLengths[this.dateIntervalLengths.length - 1];

    while (level > 0) {
      daysInAYear *= 2;
      this.dateIntervalLengths.push(daysInAYear);
      level--;
    }
  }

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.axisChanged = true;
    this.initChartMetrics();
    this.layoutLabels();
    this.axisChanged = false;
  }


  layoutLabels() {
    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
    }
  }


  getLabelText(index: number) {
    if (this.type === AxisDataType.LABEL) {
      return this.labels[index];
    } else if (this.type === AxisDataType.NUMBER) {
      return `${this.numberRange[0] + index * this.numberGap}`;
    } else if (this.type === AxisDataType.DATE) {
      const startDate = this.startDate;
      const currentDate = moment(startDate).add(index, 'days').toDate();
      return `${currentDate.getFullYear()}-${monthNames[currentDate.getMonth()]}-${currentDate.getDate()}`;
    }
  }


  setBucket(index: number, position: Vec2, alpha: number) {
    const {
      labelColor,
      labelPadding,
      labelSize,
      tickLength,
      tickWidth
    } = this;

    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        bucket.label.origin = position;
        bucket.label.color = [
          labelColor[0],
          labelColor[1],
          labelColor[2],
          alpha
        ];
        bucket.label.anchor = {
          padding: labelPadding,
          type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
        }

        bucket.tick.start = position;
        bucket.tick.end = this.verticalLayout ?
          [position[0] - tickLength, position[1]] :
          [position[0], position[1] + tickLength];
        bucket.tick.startColor = [
          bucket.tick.startColor[0],
          bucket.tick.startColor[1],
          bucket.tick.startColor[2],
          0.5 + 0.5 * alpha
        ];

        bucket.tick.endColor = [
          bucket.tick.endColor[0],
          bucket.tick.endColor[1],
          bucket.tick.endColor[2],
          0.5 + 0.5 * alpha
        ];

        if (!bucket.display) {
          bucket.display = true;
          this.providers.labels.add(bucket.label);
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const text = this.getLabelText(index);

        const label = new LabelInstance({
          anchor: {
            padding: labelPadding,
            type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
          },
          color: [labelColor[0], labelColor[1], labelColor[2], alpha],
          fontSize: labelSize,
          origin: position,
          text,
          onReady: label => {
            if (label.size[1] > this.maxLabelHeight) {
              this.maxLabelHeight = label.size[1];
              if (this.maxLabelHeight > this.preSetMaxHeight && this.verticalLayout) {
                this.updateInterval();
                this.updateIndexRange();
                this.layoutVertical();
              }
            }

            if (label.size[0] > this.maxLabelWidth) {
              this.maxLabelWidth = label.size[0];
              if (this.maxLabelWidth > this.preSetMaxWidth && !this.verticalLayout) {
                this.updateInterval();
                this.updateIndexRange();
                this.layoutHorizon();
              }
            }
          }
        });

        const tick = new EdgeInstance({
          start: position,
          end: this.verticalLayout ?
            [position[0] - tickLength, position[1]] :
            [position[0], position[1] + tickLength],
          thickness: [tickWidth, tickWidth],
          startColor: [1, 1, 1, 0.5 + 0.5 * alpha],
          endColor: [1, 1, 1, 0.5 + 0.5 * alpha]
        })

        const bucket: Bucket = { label, tick, display: true };
        this.bucketMap.set(index, bucket);
        this.providers.labels.add(bucket.label);
        this.providers.ticks.add(bucket.tick);
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.display) {
          bucket.display = false;
          this.providers.labels.remove(bucket.label);
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }



  layoutHorizon() {
    const {
      interval,
      lowerInterval,
      maxLabelWidth,
      preSetMaxWidth,
      scale,
      unitWidth,
    } = this;

    const curScale = 0.5 * Math.pow(2, scale)
    const maxBucketWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

    const lowerScale = maxBucketWidth / (unitWidth * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketWidth / (unitWidth * interval * 0.5) :
      maxBucketWidth / (unitWidth * lowerInterval);
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      this.layoutLabelOrNumber(alphaScale, lowerScale, higherScale);
    } else if (this.type === AxisDataType.DATE) {
      this.layoutDateLabels(alphaScale, lowerScale, higherScale);
    }
  }

  layoutVertical() {
    const {
      interval,
      lowerInterval,
      maxLabelHeight,
      preSetMaxHeight,
      scale,
      unitHeight
    } = this;

    const curScale = 0.5 * Math.pow(2, scale)
    const maxBucketHeight = maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;
    const lowerScale = maxBucketHeight / (unitHeight * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketHeight / (unitHeight * interval * 0.5) :
      maxBucketHeight / (unitHeight * lowerInterval);
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      this.layoutLabelOrNumber(alphaScale, lowerScale, higherScale);
    } else if (this.type === AxisDataType.DATE) {
      this.layoutDateLabels(alphaScale, lowerScale, higherScale);
    }
  }

  layoutLabelOrNumber(alphaScale: number, lowerScale: number, higherScale: number) {
    const {
      higherInterval,
      unitWidth,
      unitHeight,
      interval,
      scale,
      view
    } = this;

    const curScale = 0.5 * Math.pow(2, scale)
    const origin = view.origin;
    const start = Math.ceil(this.indexRange[0] / interval) * interval;
    const end = Math.floor(this.indexRange[1] / interval) * interval;

    if (this.verticalLayout) {
      const unitH = unitHeight * curScale;

      for (let i = start; i <= end; i += interval) {
        const y = origin[1] - (i + 0.5) * unitH - this.offset;
        let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
        if (i % higherInterval === 0) alpha = 1;
        this.setBucket(i, [origin[0], y], alpha);
      }
    } else {
      const unitW = unitWidth * curScale;
      for (let i = start; i <= end; i += interval) {
        const x = origin[0] + (i + 0.5) * unitW + this.offset;
        let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
        if (i % higherInterval === 0) alpha = 1;
        this.setBucket(i, [x, origin[1]], alpha);
      }
    }

  }

  layoutDateLabels(alphaScale: number, lowerScale: number, higherScale: number) {
    const {
      scale,
      unitWidth,
      unitHeight,
      view,
    } = this;

    const curScale = 0.5 * Math.pow(2, scale)
    const unitH = unitHeight * curScale;
    const unitW = unitWidth * curScale;
    const origin = view.origin;

    if (this.scaleLevel === 0) {
      for (let index = this.indexRange[0]; index <= this.indexRange[1]; index++) {
        const day = moment(this.startDate).add(index, 'days').toDate();
        const level = getDayLevel(this.startDate, day, this.totalYears);

        if (this.verticalLayout) {
          const y = origin[1] - (index + 0.5) * unitH - this.offset;
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
          if (level >= this.scaleLevel + 1) alpha = 1;
          this.setBucket(index, [origin[0], y], alpha);
        } else {
          const x = origin[0] + (index + 0.5) * unitW + this.offset;
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
          if (level >= this.scaleLevel + 1) alpha = 1;
          this.setBucket(index, [x, origin[1]], alpha);
        }
      }
    } else {
      const sd = moment(this.startDate).add(this.indexRange[0], 'days').toDate();
      const ed = moment(this.startDate).add(this.indexRange[1], 'days').toDate();
      const indices = getIndices(this.startDate, sd, ed, this.totalYears, this.scaleLevel);

      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        const day = moment(this.startDate).add(index, 'days').toDate();
        const level = getDayLevel(this.startDate, day, this.totalYears);

        if (this.verticalLayout) {
          const y = origin[1] - (index + 0.5) * unitH - this.offset;
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
          if (level >= this.scaleLevel + 1) alpha = 1;
          this.setBucket(index, [origin[0], y], alpha);
        } else {
          const x = origin[0] + (index + 0.5) * unitW + this.offset;
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
          if (level >= this.scaleLevel + 1) alpha = 1;
          this.setBucket(index, [x, origin[1]], alpha);
        }
      }
    }
  }

  removeBuckets(start: number, end: number, interval: number) {
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      this.removeLabelOrNumberBuckets(start, end, interval);
    } else {
      this.removeDateBuckets(start, end, this.preScaleLevel);
    }
  }

  removeLabelOrNumberBuckets(start: number, end: number, interval: number) {
    const s = Math.ceil(start / interval) * interval;
    const e = Math.floor(end / interval) * interval;

    for (let i = s; i <= e; i += interval) {
      if (this.bucketMap.has(i)) {
        const bucket = this.bucketMap.get(i);

        if (bucket.display) {
          bucket.display = false;
          this.providers.labels.remove(bucket.label);
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  removeDateBuckets(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    if (lowerLevel === 0) {
      for (let index = start; index <= end; index++) {
        if (this.bucketMap.has(index)) {
          const bucket = this.bucketMap.get(index);

          if (bucket.display) {
            bucket.display = false;
            this.providers.labels.remove(bucket.label);
            this.providers.ticks.remove(bucket.tick);
          }
        }
      }
    } else {
      const s = moment(this.startDate).add(start, 'days').toDate();
      const e = moment(this.startDate).add(end, 'days').toDate();
      const indices = getIndices(this.startDate, s, e, this.totalYears, lowerLevel, higherLevel);

      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];

        if (this.bucketMap.has(index)) {
          const bucket = this.bucketMap.get(index);

          if (bucket.display) {
            bucket.display = false;
            this.providers.labels.remove(bucket.label);
            this.providers.ticks.remove(bucket.tick);
          }
        }
      }
    }
  }


  updateInterval() {
    const {
      scale,
      unitWidth,
      unitHeight,
      maxLabelHeight,
      maxLabelWidth,
      preSetMaxWidth,
      preSetMaxHeight
    } = this;

    this.preInterval = this.interval;
    this.preScaleLevel = this.scaleLevel;
    const curScale = 0.5 * Math.pow(2, scale);

    if (this.verticalLayout) {
      const unitH = unitHeight * curScale;
      const maxHeight = this.maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;

      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        if (this.interval * unitH <= maxHeight) {
          while (this.interval * unitH <= maxHeight) {
            this.interval *= 2;
          }
        } else {
          while (this.lowerInterval * unitH > maxHeight) {
            this.interval /= 2;
            this.lowerInterval = this.interval === 1 ? 0 : this.interval / 2;
          }
        }
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[this.scaleLevel];

        if (this.interval * unitH <= maxHeight) {
          while (this.interval * unitH <= maxHeight) {
            this.scaleLevel++;
            this.interval = this.dateIntervalLengths[this.scaleLevel];
          }
        } else {
          while (this.lowerInterval * unitH > maxHeight) {
            this.scaleLevel--;
            this.interval = this.dateIntervalLengths[this.scaleLevel];
            if (this.scaleLevel === 0) this.lowerInterval = 0;
            else this.lowerInterval = this.dateIntervalLengths[this.scaleLevel - 1];
          }
        }
      }
    } else {
      const unitW = unitWidth * curScale;
      const maxWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        if (this.interval * unitW <= maxWidth) {
          while (this.interval * unitW <= maxWidth) {
            this.interval *= 2;
          }
        } else {
          while (this.lowerInterval * unitW > maxWidth) {
            this.interval /= 2;
            this.lowerInterval = this.interval === 1 ? 0 : this.interval / 2;
          }
        }
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[this.scaleLevel];

        if (this.interval * unitW <= maxWidth) {
          while (this.interval * unitW <= maxWidth) {
            this.scaleLevel++;
            this.interval = this.dateIntervalLengths[this.scaleLevel];
          }
        } else {
          while (this.lowerInterval * unitW > maxWidth) {
            this.scaleLevel--;
            this.interval = this.dateIntervalLengths[this.scaleLevel];
            if (this.scaleLevel === 0) this.lowerInterval = 0;
            else this.lowerInterval = this.dateIntervalLengths[this.scaleLevel - 1];
          }
        }
      }
    }

    if (this.interval != 1) this.lowerInterval = this.interval / 2;
    this.higherInterval = this.interval * 2;
  }

  updateIndexRange() {
    const {
      maxRange,
      scale,
      unitWidth,
      unitHeight,
      viewRange
    } = this;

    const curScale = 0.5 * Math.pow(2, scale)
    const unit = this.verticalLayout ? unitHeight * curScale : unitWidth * curScale;

    const start = Math.ceil((viewRange[0] - maxRange[0]) / unit);
    const end = Math.floor((viewRange[1] - maxRange[0]) / unit);
    const oldStart = this.indexRange[0];
    const oldEnd = this.indexRange[1];

    if (oldEnd < start || oldStart > end) {
      // remove [oldStart, oldEnd]
      this.removeBuckets(oldStart, oldEnd, this.preInterval);
    } else {
      if (oldEnd >= start && oldStart < start) {
        // remove [oldStart, start]
        this.removeBuckets(oldStart, start, this.preInterval);
      }

      if (oldStart <= end && oldEnd > end) {
        // remove [end, oldEnd]
        this.removeBuckets(end, oldEnd, this.preInterval);
      }
    }

    // remove buckets at lower level
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      if (this.preInterval < this.interval) {
        this.removeLabelOrNumberBuckets(start, end, this.preInterval);
      }
    } else if (this.type === AxisDataType.DATE) {
      this.removeDateBuckets(start, end, this.scaleLevel - 1, this.scaleLevel - 1);
      /*const s = moment(this.startDate).add(start, 'days').toDate();
      const e = moment(this.startDate).add(end, 'days').toDate();
      if (this.scaleLevel - 1 === 0) {
        for (let index = start; index <= end; index++) {
          if (this.bucketMap.has(index)) {
            const day = moment(this.startDate).add(index, 'days').toDate();
            const level = getDayLevel(this.startDate, day, this.totalYears);

            if (level < this.scaleLevel) {
              const bucket = this.bucketMap.get(index);

              if (bucket.display) {
                bucket.display = false;
                this.providers.labels.remove(bucket.label);
                this.providers.ticks.remove(bucket.tick);
              }
            }

          }
        }
      } else {
        const indices = getIndices(this.startDate, s, e, this.totalYears, this.scaleLevel - 1, this.scaleLevel - 1);

        for (let i = 0; i <= indices.length; i++) {
          const index = indices[i];

          if (this.bucketMap.has(index)) {
            // const day = moment(this.startDate).add(index, 'days').toDate();
            // const level = getDayLevel(this.startDate, day, this.totalYears);

            const bucket = this.bucketMap.get(index);

            if (bucket.display) {
              bucket.display = false;
              this.providers.labels.remove(bucket.label);
              this.providers.ticks.remove(bucket.tick);
            }
          }

        }
      }*/
    }

    // update index range
    this.indexRange = [start, end];
  }

  // Only update viewRange , then update offset and scale
  updateScale(mouse: Vec2, scale: Vec3) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.max(newScale, 1);
    const curScale = 0.5 * Math.pow(2, this.scale);
    const width = this.view.size[0];
    const height = this.view.size[1];

    if (this.verticalLayout) {
      const downY = this.maxRange[0];
      const upY = this.maxRange[1];
      const vd = this.viewRange[0];
      const vu = this.viewRange[1];
      const pointY = Math.min(Math.max(vd, window.innerHeight - mouse[1]), vu);
      const newHeight = height * curScale;
      const upHeight = (pointY - downY) * newHeight / (upY - downY);
      const newDownY = pointY - upHeight;
      const newUpY = newDownY + newHeight;
      this.updateMaxRange(newDownY, newUpY, newHeight);
    } else {
      const leftX = this.maxRange[0];
      const rightX = this.maxRange[1];
      const vl = this.viewRange[0];
      const vr = this.viewRange[1];
      const pointX = Math.min(Math.max(vl, mouse[0]), vr);
      const newWidth = width * curScale;
      const leftWidth = (pointX - leftX) * newWidth / (rightX - leftX);
      let newLeftX = pointX - leftWidth;
      let newRightX = newLeftX + newWidth;
      this.updateMaxRange(newLeftX, newRightX, newWidth);
    }
  }

  updateOffset(offset: Vec3) {
    if (this.verticalLayout) {
      const downY = this.maxRange[0] - offset[1];
      const upY = this.maxRange[1] - offset[1];
      const height = this.maxRange[1] - this.maxRange[0];
      this.updateMaxRange(downY, upY, height);
    } else {
      const leftX = this.maxRange[0] + offset[0];
      const rightX = this.maxRange[1] + offset[0];
      const width = this.maxRange[1] - this.maxRange[0];
      this.updateMaxRange(leftX, rightX, width);
    }
  }

  updateMaxRange(low: number, high: number, length: number) {
    if (low >= this.viewRange[0] && high <= this.viewRange[1]) {
      low = this.viewRange[0];
      high = this.viewRange[1];
    } else if (low >= this.viewRange[0]) {
      low = this.viewRange[0];
      high = low + length;
    } else if (high <= this.viewRange[1]) {
      high = this.viewRange[1];
      low = high - length;
    }

    this.maxRange = [low, high];
    this.offset = this.maxRange[0] - this.viewRange[0];

    this.updateInterval();
    this.updateIndexRange();
    this.layoutLabels();
  }
}
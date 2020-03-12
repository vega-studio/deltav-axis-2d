import { InstanceProvider, EdgeInstance, LabelInstance, Color, AnchorType } from "deltav";
import { AxisDataType, Vec2, Vec3, Bucket } from "src/types";
import {
  dateLevel,
  getMomentLevel,
  getIntervalLengths,
  getIndices,
  getSimpleIndices,
  getSimpleIntervalLengths,
  getSimpleMomentLevel
} from "src/util/dateUtil";
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
  maxLabelLength?: number;
  verticalLayout?: boolean;
}

export class AxisStore {
  // Layout mode
  verticalLayout: boolean = false;
  axisChanged: boolean = false;
  resizeWithWindow: boolean = true;

  // data type
  type: AxisDataType;

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
  maxLabelLengh: number = 10;
  decimalLength: number = 3;
  labels: string[];
  dates: dateLevel[];

  // Range
  maxRange: Vec2;
  viewRange: Vec2;
  preSetMaxWidth: number = 0;
  preSetMaxHeight: number = 0;

  // Range
  numberRange: Vec2 = [0, 100];
  numberGap: number = 1;

  startDate: Date = new Date(2000, 0, 1);
  endDate: Date = new Date();
  totalYears: number;
  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;
  offset: number = 0;
  scale: number = 1;

  windowWidth: number = 0;
  windowHeight: number = 0;

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
    this.preSetMaxWidth = 10;
    this.preSetMaxHeight = options.labelSize || this.labelSize;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.maxLabelLengh = options.maxLabelLength || this.maxLabelLengh;
    this.type = options.type;

    if (this.type === AxisDataType.DATE) {
      if (options.startDate) {
        this.startDate = typeof options.startDate === "string" ?
          new Date(options.startDate) : options.startDate;
      }

      if (options.endDate) {
        this.endDate = typeof options.endDate === "string" ?
          new Date(options.endDate) : options.endDate;
      }
    } else if (this.type = AxisDataType.NUMBER) {
      this.numberRange = options.numberRange || this.numberRange;
      this.numberGap = options.numberGap || this.numberGap;
    }

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

        this.auxLines.push(line1);
        this.auxLines.push(line2);
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

        this.auxLines.push(line1);
        this.auxLines.push(line2);
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

    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

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
        this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'milliseconds') + 1;

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
    // this.dateIntervalLengths = getIntervalLengths(this.startDate, this.endDate);
    this.dateIntervalLengths = getSimpleIntervalLengths(this.startDate, this.endDate);
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
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.indexRange = [0, this.unitNumber - 1];
    this.drawAuxilaryLines();

    setTimeout(() => {
      this.layoutLabels();
    }, 1);
  }

  removeAll() {
    this.bucketMap.forEach(bucket => {
      if (bucket.display) {
        bucket.display = false;
        this.providers.labels.remove(bucket.label1);
        if (bucket.label2) this.providers.labels.remove(bucket.label2);
        this.providers.ticks.remove(bucket.tick);
      }
    })

    this.providers.labels.clear();
    this.providers.labels.clear();
    this.bucketMap.clear();
  }

  resize() {
    if (this.resizeWithWindow) {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      const newOrigin: Vec2 = [
        this.view.origin[0] * newWidth / this.windowWidth,
        this.view.origin[1] * newHeight / this.windowHeight
      ];

      const newSize: Vec2 = [
        this.view.size[0] * newWidth / this.windowWidth,
        this.view.size[1] * newHeight / this.windowHeight
      ];

      this.windowWidth = newWidth;
      this.windowHeight = newHeight;

      this.setView({
        origin: newOrigin,
        size: newSize
      })
    }
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
      const text = this.labels[index];

      if (text.length > this.maxLabelLengh) {
        return text.substr(0, this.maxLabelLengh).concat("...")
      }

      return text;
    } else if (this.type === AxisDataType.NUMBER) {
      const number = this.numberRange[0] + index * this.numberGap;
      if (number % 1 !== 0) return number.toFixed(this.decimalLength);
      return number.toString();
    } else if (this.type === AxisDataType.DATE) {
      return this.getDateLabel1(index);
    }
  }

  getDateLabel1(index: number) {
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

    return `${ms} ms`
  }

  getDateLabel2(index: number) {
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

  setBucket(index: number, position: Vec2, alpha: number) {
    const {
      labelColor,
      labelPadding,
      labelSize,
      tickLength,
      tickWidth
    } = this;

    const labelAlpha = alpha > 0.4 ? (alpha - 0.4) * 5 / 3 : 0;
    const tickAlpha = alpha;

    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        bucket.label1.origin = position;
        bucket.label1.color = [
          labelColor[0],
          labelColor[1],
          labelColor[2],
          labelAlpha
        ];

        bucket.label1.anchor = {
          padding: labelPadding,
          type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
        }

        if (bucket.label2 && !this.verticalLayout) {
          bucket.label2.origin = position;
          bucket.label2.color = [
            labelColor[0],
            labelColor[1],
            labelColor[2],
            labelAlpha
          ];

          bucket.label2.anchor = {
            padding: labelPadding + labelSize,
            type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
          }
        }

        bucket.tick.start = position;
        bucket.tick.end = this.verticalLayout ?
          [position[0] - tickLength, position[1]] :
          [position[0], position[1] + tickLength];
        bucket.tick.startColor = [
          bucket.tick.startColor[0],
          bucket.tick.startColor[1],
          bucket.tick.startColor[2],
          tickAlpha
        ];

        bucket.tick.endColor = [
          bucket.tick.endColor[0],
          bucket.tick.endColor[1],
          bucket.tick.endColor[2],
          tickAlpha
        ];

        if (!bucket.display) {
          bucket.display = true;
          this.providers.labels.add(bucket.label1);
          if (bucket.label2) this.providers.labels.add(bucket.label2);
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const text = this.getLabelText(index);

        const label1 = new LabelInstance({
          anchor: {
            padding: labelPadding,
            type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
          },
          color: [labelColor[0], labelColor[1], labelColor[2], labelAlpha],
          fontSize: labelSize,
          origin: position,
          text,
          onReady: label => {
            if (label.size[1] > this.maxLabelHeight) {
              this.maxLabelHeight = label.size[1];
              if (this.maxLabelHeight > this.preSetMaxHeight && this.verticalLayout) {
                //this.updateInterval();
                //this.updateIndexRange();
                //this.layoutVertical();
              }
            }

            if (label.size[0] > this.maxLabelWidth) {
              this.maxLabelWidth = label.size[0];
              if (this.maxLabelWidth > this.preSetMaxWidth && !this.verticalLayout) {
                //this.updateInterval();
                //this.updateIndexRange();
                //this.layoutHorizon();
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
          startColor: [1, 1, 1, tickAlpha],
          endColor: [1, 1, 1, tickAlpha]
        });

        const day = moment(this.startDate).add(index, 'milliseconds').toDate();

        if (
          this.type === AxisDataType.DATE &&
          !this.verticalLayout &&
          (day.getMonth() !== 0 ||
            day.getDate() !== 1)
        ) {
          const label2 = new LabelInstance({
            anchor: {
              padding: labelPadding + labelSize,
              type: AnchorType.TopMiddle
            },
            color: [labelColor[0], labelColor[1], labelColor[2], labelAlpha],
            fontSize: labelSize,
            origin: position,
            text: this.getDateLabel2(index)
          });

          const bucket: Bucket = { label1, label2, tick, display: true };
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.label1);
          this.providers.labels.add(bucket.label2);
          this.providers.ticks.add(bucket.tick);
        } else {
          const bucket: Bucket = { label1, tick, display: true };
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.label1);
          this.providers.ticks.add(bucket.tick);
        }
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.display) {
          bucket.display = false;
          this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
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
    const maxBucketWidth = preSetMaxWidth; // maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

    const lowerScale = maxBucketWidth / (unitWidth * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketWidth / (unitWidth * interval * 0.5) :
      maxBucketWidth / (unitWidth * lowerInterval);
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      this.layoutLabelOrNumber(alphaScale, lowerScale, higherScale);
    } else if (this.type === AxisDataType.DATE) {
      console.log("LAYOUT DATE LABELS")
      this.layoutDateLabels(alphaScale, lowerScale, higherScale);
    }
  }

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.view = view;
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.interval = 1;
    this.lowerInterval = 0;
    this.higherInterval = 2;
    this.preInterval = 1;
    this.scaleLevel = 0;
    this.preScaleLevel = 0;
    this.indexRange = [0, this.unitNumber - 1];
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();

    setTimeout(() => {
      this.layoutLabels();
    }, 1);

  }

  setDateRange(startDate: string | Date, endDate: string | Date) {
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
    this.scaleLevel = 0;
    this.preScaleLevel = 0;

    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();

    setTimeout(() => {
      this.layoutLabels();
    }, 1);
  }

  setNumberRange(start: number, end: number) {
    this.numberRange = [start, end];
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.maxLabelWidth = 0;
    this.maxLabelHeight = 0;

    this.removeAll();
    this.updateInterval();

    setTimeout(() => {
      this.layoutLabels();
    }, 1);
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

    const sd = moment(this.startDate).add(this.indexRange[0], 'milliseconds').toDate();
    const ed = moment(this.startDate).add(this.indexRange[1], 'milliseconds').toDate();

    //const maxLevel = this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0 + 25;
    const maxLevel = this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0 + 9;
    // const indices = getIndices(this.startDate, sd, ed, this.totalYears, this.scaleLevel, maxLevel);
    const indices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.scaleLevel, maxLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      // const level = getMomentLevel(this.startDate, day, this.totalYears);
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);

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

  removeBuckets(start: number, end: number, interval: number) {
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      this.removeLabelOrNumberBuckets(start, end, interval);
    } else {
      // const maxLevel = this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0 + 25;
      const maxLevel = this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0 + 9;
      console.log("REOMVE BUCKETS");
      this.removeDateBuckets(start, end, this.preScaleLevel, maxLevel);
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
          this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  removeDateBuckets(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const startMoment = moment(this.startDate).add(start, 'milliseconds').toDate();
    const endMoment = moment(this.startDate).add(end, 'milliseconds').toDate();

    // const indices = getIndices(this.startDate, startMoment, endMoment, this.totalYears, lowerLevel, higherLevel);
    const indices = getSimpleIndices(this.startDate, this.totalYears, startMoment, endMoment, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.display) {
          bucket.display = false;
          this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
          this.providers.ticks.remove(bucket.tick);
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

          if (this.interval * unitH < maxHeight) {
            this.interval *= 2;
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

          if (this.interval * unitH <= maxHeight) {
            this.scaleLevel++;
            this.interval = this.dateIntervalLengths[this.scaleLevel];
            if (this.scaleLevel === 0) this.lowerInterval = 0;
            else this.lowerInterval = this.dateIntervalLengths[this.scaleLevel - 1];
          }
        }
      }
    } else {
      const unitW = unitWidth * curScale;
      const maxWidth = preSetMaxWidth; //maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

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

          if (this.interval * unitW < maxWidth) {
            this.interval *= 2;
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

          if (this.interval * unitW <= maxWidth) {
            this.scaleLevel++;
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

    const start = Math.floor((viewRange[0] - maxRange[0]) / unit);
    const end = Math.ceil((viewRange[1] - maxRange[0]) / unit);
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
      this.removeDateBuckets(start, end, this.scaleLevel - 5, this.scaleLevel - 1);
    }

    // update index range
    this.indexRange = [start, end];
  }

  // Only update viewRange , then update offset and scale
  updateScale(mouse: Vec2, scale: Vec3) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.min(Math.max(newScale, 1), Math.log2(2 * this.unitNumber));
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
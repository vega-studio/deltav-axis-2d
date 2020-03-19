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
  tickStartWidth: number = 10;
  tickStartHeight: number = 2;

  // Label Metrics
  labelSize: number = 12;
  labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  labelPadding: number = 10;

  maxLabelWidth: number = 0;
  maxLabelHeight: number = 0;
  maxLabelLengh: number = 10;

  preSetMaxWidth: number = 0;
  preSetMaxHeight: number = 0;

  decimalLength: number = 3;
  labels: string[];
  dates: dateLevel[];

  // Range
  maxRange: Vec2;
  viewRange: Vec2;

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

  firstRender: boolean = false;

  // Interval info
  interval: number = 1;
  lowerInterval: number = 0;
  higherInterval: number = 2; // For labels and number
  preInterval: number = 1; // For labels and numbers
  labelInterval: number = 1;
  lowerLabelInterval: number = 0;
  tickInterval: number = 1;
  lowerTickInterval: number = 0;

  labelScaleLevel: number = 0;
  preLabelScaleLevel: number = 0;
  tickScaleLevel: number = 0;
  preTickScaleLevel: number = 0;
  labelIntervalLengths: number[];
  tickIntervalLengths: number[];
  indexRange: Vec2 = [-1, -1];
  bucketMap: Map<number, Bucket> = new Map<number, Bucket>();
  auxLines: EdgeInstance[] = [];
  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.view = options.view;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.maxLabelLengh = options.maxLabelLength || this.maxLabelLengh;
    this.type = options.type;
    this.verticalLayout = options.verticalLayout === undefined ? this.verticalLayout : options.verticalLayout;
    Object.assign(this.providers, options.providers);
    this.initType(options);
    this.init();
    this.firstRender = false;
  }

  getPreSetWidth() {
    if (this.type === AxisDataType.LABEL) {
      let maxLength = 0;
      this.labels.forEach(label => maxLength = Math.max(maxLength, label.length));
      return maxLength * this.labelSize / 2;
    } else if (this.type === AxisDataType.NUMBER) {
      const startString = this.numberRange[0].toFixed(this.decimalLength);
      const endString = this.numberRange[1].toFixed(this.decimalLength);
      return Math.max(startString.length, endString.length) * this.labelSize / 2;
    } else if (this.type === AxisDataType.DATE) {
      return 4 * this.labelSize;
    }
  }

  getPreSetHeight() {
    return this.labelSize;
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

      this.providers.ticks.add(this.auxLines[0]);
      this.providers.ticks.add(this.auxLines[1]);
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

        this.numberRange = options.numberRange || this.numberRange;
        this.numberGap = options.numberGap || this.numberGap;
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

    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
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

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.indexRange = [0, this.unitNumber - 1];
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  removeAll() {
    this.bucketMap.forEach(bucket => {
      if (bucket.displayLabel) {
        bucket.displayLabel = false;
        this.providers.labels.remove(bucket.label1);
        if (bucket.label2) this.providers.labels.remove(bucket.label2);
      }

      if (bucket.displayTick) {
        bucket.displayTick = false;
        this.providers.ticks.remove(bucket.tick);
      }
    })

    this.providers.labels.clear();
    this.providers.ticks.clear();
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

  createNewLabel(text: string, position: Vec2, alpha: number, padding: number) {
    const label = new LabelInstance({
      anchor: {
        padding,
        type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      },
      color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], alpha],
      fontSize: this.labelSize,
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
          if (this.type === AxisDataType.DATE) console.warn("Date", label.text, label.size[0]);
          if (this.maxLabelWidth > this.preSetMaxWidth && !this.verticalLayout) {
            this.updateInterval();
            this.updateIndexRange();
            this.layoutHorizon();
          }
        }
      }
    });

    return label;
  }

  updateLabel(label: LabelInstance, position: Vec2, alpha: number, padding: number) {
    label.origin = position;
    label.color = [
      this.labelColor[0],
      this.labelColor[1],
      this.labelColor[2],
      alpha
    ];
    label.anchor = {
      padding,
      type: this.verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
    }
  }

  createTick(position: Vec2, alpha: number) {
    const {
      tickLength,
      tickWidth
    } = this;

    const tick = new EdgeInstance({
      start: position,
      end: this.verticalLayout ?
        [position[0] - tickLength, position[1]] :
        [position[0], position[1] + tickLength],
      thickness: [tickWidth, tickWidth],
      startColor: [1, 1, 1, alpha],
      endColor: [1, 1, 1, alpha]
    });

    return tick;
  }

  updateTick(tick: EdgeInstance, position: Vec2, alpha: number) {
    const {
      tickLength
    } = this;

    tick.start = position;
    tick.end = this.verticalLayout ?
      [position[0] - tickLength, position[1]] :
      [position[0], position[1] + tickLength];
    tick.startColor = [
      tick.startColor[0],
      tick.startColor[1],
      tick.startColor[2],
      alpha
    ];
    tick.endColor = [
      tick.endColor[0],
      tick.endColor[1],
      tick.endColor[2],
      alpha
    ];
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

        if (bucket.label1) {
          this.updateLabel(bucket.label1, position, labelAlpha, labelPadding);
        }

        if (bucket.tick) {
          this.updateTick(bucket.tick, position, tickAlpha);
        }

        if (!bucket.displayLabel) {
          bucket.displayLabel = true;
          this.providers.labels.add(bucket.label1);
        }

        if (!bucket.displayTick) {
          bucket.displayTick = true;
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const text = this.getLabelText(index);
        const label1 = this.createNewLabel(text, position, labelAlpha, labelPadding);
        const tick = this.createTick(position, tickAlpha);
        const bucket: Bucket = { label1, tick, displayLabel: true, displayTick: true };
        this.bucketMap.set(index, bucket);
        this.providers.labels.add(bucket.label1);
        this.providers.ticks.add(bucket.tick);

      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.displayLabel) {
          bucket.displayLabel = false;
          this.providers.labels.remove(bucket.label1);
        }

        if (bucket.displayTick) {
          bucket.displayTick = false;
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

        if (bucket.label1) {
          this.updateLabel(bucket.label1, position, alpha, labelPadding);
        } else {
          const text = this.getLabelText(index);
          const labelAlpha = this.firstRender ? 0 : alpha;
          bucket.label1 = this.createNewLabel(text, position, labelAlpha, labelPadding);
        }

        if (this.type === AxisDataType.DATE && !this.verticalLayout) {
          if (bucket.label2) {
            this.updateLabel(bucket.label2, position, alpha, labelPadding + labelSize);
          } else if (!atStartMoment) {
            const text = this.getDateLabel2(index);
            const labelAlpha = this.firstRender ? 0 : alpha;
            bucket.label2 = this.createNewLabel(text, position, labelAlpha, labelPadding + labelSize)
          }
        }

        if (!bucket.displayLabel) {
          bucket.displayLabel = true;
          this.providers.labels.add(bucket.label1);
          if (bucket.label2) this.providers.labels.add(bucket.label2);
        }
      } else {
        const text = this.getLabelText(index);
        const labelAlpha = this.firstRender ? 0 : alpha;
        const label1 = this.createNewLabel(text, position, labelAlpha, labelPadding);

        if (
          this.type === AxisDataType.DATE &&
          !this.verticalLayout &&
          !atStartMoment
        ) {
          const labelAlpha = this.firstRender ? 0 : alpha;
          const label2 = this.createNewLabel(text, position, labelAlpha, labelPadding + labelSize);

          const bucket: Bucket = { label1, label2, displayLabel: true, displayTick: false };
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.label1);
          this.providers.labels.add(bucket.label2);
        } else {
          const bucket: Bucket = { label1, displayLabel: true, displayTick: false };
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.label1);
        }
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.displayLabel) {
          bucket.displayLabel = false;
          this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
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
          this.updateTick(bucket.tick, position, alpha);
        } else {
          const tickAlpha = this.firstRender ? 0 : alpha;
          bucket.tick = this.createTick(position, tickAlpha);
        }

        if (!bucket.displayTick) {
          bucket.displayTick = true;
          this.providers.ticks.add(bucket.tick);
        }
      } else {
        const tickAlpha = this.firstRender ? 0 : alpha;
        const tick = this.createTick(position, tickAlpha);
        const bucket: Bucket = { tick, displayLabel: false, displayTick: true };
        this.bucketMap.set(index, bucket);
        this.providers.ticks.add(bucket.tick);
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.displayTick) {
          bucket.displayTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  layoutLabels() {
    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
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

    const curScale = 0.5 * Math.pow(2, scale);
    const maxBucketWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      const lowerScale = maxBucketWidth / (unitWidth * interval);
      const higherScale = lowerInterval === 0 ?
        maxBucketWidth / (unitWidth * interval * 0.5) :
        maxBucketWidth / (unitWidth * lowerInterval);
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
      this.layoutLabelOrNumber(alpha);
    } else if (this.type === AxisDataType.DATE) {
      // TickScale
      const tickBucketWidth = this.tickStartWidth;
      const tickLowerScale = tickBucketWidth / (unitWidth * this.tickInterval);
      const tickHigherScale = 2 * tickLowerScale;
      /*this.lowerTickInterval === 0 ?
        tickBucketWidth / (unitWidth * this.tickInterval * 0.5) :
        tickBucketWidth / (unitWidth * this.lowerTickInterval);*/
      const tickAlphaScale = Math.min(Math.max(curScale, tickLowerScale), tickHigherScale);
      const tickAlpha = (tickAlphaScale - tickLowerScale) / (tickHigherScale - tickLowerScale);

      // LabelScale
      const labelBucketWidth = maxBucketWidth;
      const labelLowerScale = this.tickStartWidth / (unitWidth * this.labelInterval);
      const labelHigherScale = labelBucketWidth / (unitWidth * this.labelInterval);
      /*this.lowerLabelInterval === 0 ?
        labelBucketWidth / (unitWidth * this.labelInterval * 0.5) :
        labelBucketWidth / (unitWidth * this.lowerLabelInterval);*/
      const labelAlphaScale = Math.min(Math.max(curScale, labelLowerScale), labelHigherScale);
      const labelAlpha = (labelAlphaScale - labelLowerScale) / (labelHigherScale - labelLowerScale);

      this.layoutDateLabels(tickAlpha, labelAlpha);
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

    const curScale = 0.5 * Math.pow(2, scale);
    const maxBucketHeight = maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      const lowerScale = maxBucketHeight / (unitHeight * interval);
      const higherScale = lowerInterval === 0 ?
        maxBucketHeight / (unitHeight * interval * 0.5) :
        maxBucketHeight / (unitHeight * lowerInterval);
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
      this.layoutLabelOrNumber(alpha);
    } else if (this.type === AxisDataType.DATE) {
      // Tick
      const tickBucketHeight = this.tickStartHeight;
      const tickLowerScale = tickBucketHeight / (unitHeight * this.tickInterval);
      const tickHigherScale = 2 * tickLowerScale;
      /*this.lowerTickInterval === 0 ?
        tickBucketHeight / (unitHeight * this.tickInterval * 0.5) :
        tickBucketHeight / (unitHeight * this.lowerTickInterval);*/
      const tickAlphaScale = Math.min(Math.max(curScale, tickLowerScale), tickHigherScale);
      const tickAlpha = (tickAlphaScale - tickLowerScale) / (tickHigherScale - tickLowerScale);

      // Label
      const labelBucketHeight = maxBucketHeight;
      const labelLowerScale = this.tickStartHeight / (unitHeight * this.labelInterval);
      const labelHigherScale = labelBucketHeight / (unitHeight * this.labelInterval);
      /*this.lowerLabelInterval === 0 ?
        labelBucketHeight / (unitHeight * this.labelInterval * 0.5) :
        labelBucketHeight / (unitHeight * this.lowerLabelInterval);*/
      const labelAlphaScale = Math.min(Math.max(curScale, labelLowerScale), labelHigherScale);
      const labelAlpha = (labelAlphaScale - labelLowerScale) / (labelHigherScale - labelLowerScale);

      this.layoutDateLabels(tickAlpha, labelAlpha);
    }
  }

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.view = view;
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.higherInterval = 2;
    this.preInterval = 1;
    this.interval = 1;
    this.lowerInterval = 0;
    this.labelInterval = 1;
    this.lowerLabelInterval = 0;
    this.tickInterval = 1;
    this.lowerTickInterval = 0;
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;
    this.indexRange = [0, this.unitNumber - 1];
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
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
    this.drawAuxilaryLines();
    setTimeout(() => {
      this.layoutLabels();
    }, 1);
  }

  layoutLabelOrNumber(alpha: number) {
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
        let labelAlpha = alpha;
        const y = origin[1] - (i + 0.5) * unitH - this.offset;
        if (i % higherInterval === 0) labelAlpha = 1;
        if (this.firstRender) labelAlpha = 0;
        this.setBucket(i, [origin[0], y], labelAlpha);
      }
    } else {
      const unitW = unitWidth * curScale;

      for (let i = start; i <= end; i += interval) {
        let labelAlpha = alpha;
        const x = origin[0] + (i + 0.5) * unitW + this.offset;
        if (i % higherInterval === 0) labelAlpha = 1;
        if (this.firstRender) labelAlpha = 0;
        this.setBucket(i, [x, origin[1]], labelAlpha);
      }
    }
  }

  layoutDateLabels(tickAlpha: number, labelAlpha: number) {
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

    // Ticks
    const maxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 7;
    const tickIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.tickScaleLevel, maxLevel);

    // Set Ticks
    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);

      if (this.verticalLayout) {
        const y = origin[1] - (index + 0.5) * unitH - this.offset;
        let alpha = tickAlpha;
        if (level >= this.tickScaleLevel + 1) alpha = 1;
        this.setDateTick(index, [origin[0], y], alpha);
      } else {
        const x = origin[0] + (index + 0.5) * unitW + this.offset;
        let alpha = tickAlpha;
        if (level >= this.tickScaleLevel + 1) alpha = 1;
        this.setDateTick(index, [x, origin[1]], alpha);
      }
    }

    // Set labels
    const labelMaxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 7;
    const labelIndices = getSimpleIndices(this.startDate, this.totalYears, sd, ed, this.labelScaleLevel, labelMaxLevel);

    for (let i = 0; i < labelIndices.length; i++) {
      const index = labelIndices[i];
      const day = moment(this.startDate).add(index, 'milliseconds').toDate();
      const level = getSimpleMomentLevel(this.startDate, day, this.totalYears);

      if (this.verticalLayout) {
        const y = origin[1] - (index + 0.5) * unitH - this.offset;
        let alpha = labelAlpha;// > 0.8 ? (labelAlpha - 0.8) * 5 : 0;
        if (level >= this.labelScaleLevel + 1) alpha = 1;
        this.setDateLabel(index, [origin[0], y], alpha);
      } else {
        const x = origin[0] + (index + 0.5) * unitW + this.offset;
        let alpha = labelAlpha;// > 0.8 ? (labelAlpha - 0.8) * 5 : 0;
        if (level >= this.labelScaleLevel + 1) alpha = 1;
        this.setDateLabel(index, [x, origin[1]], alpha);
      }
    }
  }

  removeBuckets(start: number, end: number) {
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      this.removeLabelOrNumberBuckets(start, end, this.preInterval);
    } else {
      const maxLevel = (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 7;
      this.removeDateLabels(start, end, this.preLabelScaleLevel, maxLevel);
      this.removeDateTicks(start, end, this.preTickScaleLevel, maxLevel);
    }
  }

  removeLabelOrNumberBuckets(start: number, end: number, interval: number) {
    const s = Math.ceil(start / interval) * interval;
    const e = Math.floor(end / interval) * interval;

    for (let i = s; i <= e; i += interval) {
      if (this.bucketMap.has(i)) {
        const bucket = this.bucketMap.get(i);

        if (bucket.displayLabel) {
          bucket.displayLabel = false;
          if (bucket.label1) this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
        }

        if (bucket.displayTick) {
          bucket.displayTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  removeDateBuckets(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const startMoment = moment(this.startDate).add(start, 'milliseconds').toDate();
    const endMoment = moment(this.startDate).add(end, 'milliseconds').toDate();
    const indices = getSimpleIndices(this.startDate, this.totalYears, startMoment, endMoment, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.displayLabel) {
          bucket.displayLabel = false;
          this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
        }

        if (bucket.displayTick) {
          bucket.displayTick = false;
          this.providers.ticks.remove(bucket.tick);
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

        if (bucket.displayLabel) {
          bucket.displayLabel = false;
          if (bucket.label1) this.providers.labels.remove(bucket.label1);
          if (bucket.label2) this.providers.labels.remove(bucket.label2);
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

        if (bucket.displayTick) {
          bucket.displayTick = false;
          if (bucket.tick) this.providers.ticks.remove(bucket.tick);
        }
      }

    }
  }

  updateRegularInterval() {
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
    const curScale = 0.5 * Math.pow(2, scale);

    if (this.verticalLayout) {
      const unitH = unitHeight * curScale;
      const maxHeight = this.maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;

      if (this.interval * unitH <= maxHeight) {
        while (this.interval * unitH <= maxHeight) {
          this.interval *= 2;
          this.lowerInterval = this.interval / 2;
        }
      } else {
        while (this.lowerInterval * unitH > maxHeight) {
          this.interval /= 2;
          this.lowerInterval = this.interval === 1 ? 0 : this.interval / 2;
        }

        if (this.interval * unitH < maxHeight) {
          this.interval *= 2;
          this.lowerInterval = this.interval / 2;
        }
      }
    } else {
      const unitW = unitWidth * curScale;
      const maxWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;

      if (this.interval * unitW <= maxWidth) {

        while (this.interval * unitW <= maxWidth) {
          this.interval *= 2;
        }

        this.lowerInterval = this.interval / 2;
      } else {
        while (this.lowerInterval * unitW > maxWidth) {
          this.interval /= 2;
          this.lowerInterval = this.interval === 1 ? 0 : this.interval / 2;
        }

        if (this.interval * unitW < maxWidth) {
          this.interval *= 2;
          this.lowerInterval = this.interval / 2;
        }
      }
    }

    this.higherInterval = this.interval * 2;
  }

  updateDateInterval() {
    const {
      scale,
      unitWidth,
      unitHeight
    } = this;

    this.preInterval = this.interval;
    this.preTickScaleLevel = this.tickScaleLevel;
    this.preLabelScaleLevel = this.labelScaleLevel;
    const curScale = 0.5 * Math.pow(2, scale);

    if (this.verticalLayout) {
      const unitH = unitHeight * curScale;

      // Date label
      const labelMaxHeight = this.tickStartHeight;
      this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];

      if (this.labelInterval * unitH <= labelMaxHeight) {
        while (this.labelInterval * unitH <= labelMaxHeight) {
          this.labelScaleLevel++;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }
      } else {
        while (this.lowerLabelInterval * unitH > labelMaxHeight) {
          this.labelScaleLevel--;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          if (this.labelScaleLevel === 0) this.lowerLabelInterval = 0;
          else this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }

        if (this.labelInterval * unitH <= labelMaxHeight) {
          this.labelScaleLevel++;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          if (this.labelScaleLevel === 0) this.lowerLabelInterval = 0;
          else this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }
      }

      // Date tick
      const tickStartHeight = this.tickStartHeight;
      this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];

      if (this.tickInterval * unitH <= tickStartHeight) {
        while (this.tickInterval * unitH <= tickStartHeight) {
          this.tickScaleLevel++;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }
      } else {
        while (this.lowerTickInterval * unitH > tickStartHeight) {
          this.tickScaleLevel--;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          if (this.tickScaleLevel === 0) this.lowerTickInterval = 0;
          else this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }

        if (this.tickInterval * unitH <= tickStartHeight) {
          this.tickScaleLevel++;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          if (this.tickScaleLevel === 0) this.lowerTickInterval = 0;
          else this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }
      }
    } else {
      const unitW = unitWidth * curScale;

      // Update date level
      const labelMaxWidth = this.tickStartWidth;
      this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];

      if (this.labelInterval * unitW <= labelMaxWidth) {
        while (this.labelInterval * unitW <= labelMaxWidth) {
          this.labelScaleLevel++;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }
      } else {
        while (this.lowerLabelInterval * unitW > labelMaxWidth) {
          this.labelScaleLevel--;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          if (this.labelScaleLevel === 0) this.lowerLabelInterval = 0;
          else this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }

        if (this.labelInterval * unitW <= labelMaxWidth) {
          this.labelScaleLevel++;
          this.labelInterval = this.labelIntervalLengths[this.labelScaleLevel];
          if (this.labelScaleLevel === 0) this.lowerLabelInterval = 0;
          else this.lowerLabelInterval = this.labelIntervalLengths[this.labelScaleLevel - 1];
        }
      }

      // Update tick level
      const tickStartWidth = this.tickStartWidth;
      this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];

      if (this.tickInterval * unitW <= tickStartWidth) {
        while (this.tickInterval * unitW <= tickStartWidth) {
          this.tickScaleLevel++;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }
      } else {
        while (this.lowerTickInterval * unitW > tickStartWidth) {
          this.tickScaleLevel--;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          if (this.tickScaleLevel === 0) this.lowerTickInterval = 0;
          else this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }

        if (this.tickInterval * unitW <= tickStartWidth) {
          this.tickScaleLevel++;
          this.tickInterval = this.tickIntervalLengths[this.tickScaleLevel];
          if (this.tickScaleLevel === 0) this.lowerTickInterval = 0;
          else this.lowerTickInterval = this.tickIntervalLengths[this.tickScaleLevel - 1];
        }
      }
    }
  }

  updateInterval() {
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      this.updateRegularInterval();
    } else if (this.type === AxisDataType.DATE) {
      this.updateDateInterval();
    }
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
      this.removeBuckets(oldStart, oldEnd);
    } else {
      if (oldEnd >= start && oldStart < start) {
        // remove [oldStart, start]
        this.removeBuckets(oldStart, start);
      }

      if (oldStart <= end && oldEnd > end) {
        // remove [end, oldEnd]
        this.removeBuckets(end, oldEnd);
      }
    }

    // remove buckets at lower level
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      if (this.preInterval < this.interval) {
        this.removeLabelOrNumberBuckets(start, end, this.preInterval);
      }
    } else if (this.type === AxisDataType.DATE) {
      this.removeDateTicks(start, end, this.tickScaleLevel - 2, this.tickScaleLevel - 1);
      this.removeDateLabels(start, end, this.labelScaleLevel - 2, this.labelScaleLevel - 1);
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
import { InstanceProvider, EdgeInstance, LabelInstance, Color, AnchorType } from "deltav";
import { AxisDataType, Vec2, Vec3, Bucket } from "src/types";
import { dateLevel, travelDates, getDayLevel, getIntervalLengths, getMaxLevel, getIndices } from "src/util/dateUtil";
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
}

export class AxisStore {
  // Layout mode
  verticalLayout: boolean = false;
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

  dates: dateLevel[];
  startDate: Date = new Date(2000, 0, 1);
  endDate: Date = new Date();

  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;

  offset: number = 0;
  scale: number = 1;

  // Interval info
  interval: number = 1;
  lowerInterval: number = 0;
  higherInterval: number = 2;
  scaleLevel: number = 0; // for dates

  dateIntervalLengths: number[];

  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.view = options.view;
    this.preSetMaxWidth = this.view.size[0] / 20;
    this.preSetMaxHeight = this.view.size[1] / 8;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;

    this.initType(options);

    Object.assign(this.providers, options.providers);

    this.init2();
  }

  init() {
    this.initChartMetrics();
    const origin = this.view.origin;
    const w = this.view.size[0];
    const h = this.view.size[1];
    const tickLength = this.tickLength;
    const tickWidth = this.tickWidth;
    const labelPadding = this.labelPadding;
    const length = this.unitNumber;

    if (length != 0) {
      if (this.verticalLayout) {
        const intHeight = h / length;

        for (let i = 0; i < length; i++) {
          const y = origin[1] - (i + 0.5) * intHeight * this.scale + this.offset;
          // tickLine
          const tick = new EdgeInstance({
            start: [origin[0], y],
            end: [origin[0] - tickLength, y],
            thickness: [tickWidth, tickWidth],
            startColor: [1, 1, 1, 0.5],
            endColor: [1, 1, 1, 0.5]
          });

          this.tickLineInstances.push(tick);
          // label
          const label = new LabelInstance({
            anchor: {
              padding: labelPadding,
              type: AnchorType.MiddleRight
            },
            color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], 0],
            fontSize: this.labelSize,
            origin: [origin[0], y],
            text: this.labels[i],

            onReady: label => {
              if (label.size[0] > this.maxLabelWidth) {
                this.maxLabelWidth = label.size[0];
                // this.updateChartMetrics();
                this.layoutLabels();
              }

              if (label.size[1] > this.maxLabelHeight) {
                this.maxLabelHeight = label.size[1];
                this.layoutLabels();
              }
            }
          });

          this.labelInstances.push(label);

          const curY = window.innerHeight - y;

          if (curY >= this.viewRange[0] && curY <= this.viewRange[1]) {
            this.providers.ticks.add(tick);
            this.providers.labels.add(label)
          }

        }
      } else {
        const intWidth = w / length;

        for (let i = 0; i < length; i++) {
          const x = origin[0] + (i + 0.5) * intWidth * this.scale + this.offset;
          // tickLine
          const tick = new EdgeInstance({
            start: [x, origin[1]],
            end: [x, origin[1] + tickLength],
            thickness: [tickWidth, tickWidth],
            startColor: [1, 1, 1, 0.5],
            endColor: [1, 1, 1, 0.5]
          });

          this.tickLineInstances.push(tick);

          const labelText = this.labels[i];
          const text = labelText.length > this.maxLabelLengh ?
            labelText.substr(0, this.maxLabelLengh) : labelText;

          // label
          const label = new LabelInstance({
            anchor: {
              padding: labelPadding,
              type: AnchorType.TopMiddle
            },
            color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], 0],
            fontSize: this.labelSize,
            origin: [x, origin[1] + 10],
            text,
            onReady: label => {
              if (label.size[1] > this.maxLabelHeight) {
                this.maxLabelHeight = label.size[1];
              }

              if (label.size[0] > this.maxLabelWidth) {
                this.maxLabelWidth = label.size[0];
                this.layoutLabels();
              }
            }
          });

          this.labelInstances.push(label);

          if (x >= this.viewRange[0] && x <= this.viewRange[1]) {
            this.providers.ticks.add(tick);
            this.providers.labels.add(label);
          }
        }
      }
    }
  }

  init2() {
    this.initChartMetrics();
    this.updateInterval();

    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
    }

    this.drawAuxilaryLines();
  }

  auxLines: EdgeInstance[] = [];

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
        this.generateDateInterval();
        this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'days') + 1;

        getMaxLevel(this.startDate, this.endDate);
        console.warn("unit number", this.unitNumber);

        const list = getIndices(this.startDate, this.startDate, this.endDate, 13);

        list.forEach(index => {
          const day = moment(this.startDate).add(index, "days").toDate().toString();
          console.warn("day is ", day);
        })
    }

    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
  }

  generateLabelTexts(options: IAxisStoreOptions) {
    const type = options.type;

    if (type === AxisDataType.LABEL) {
      if (!options.labels) {
        console.error("With type LABEL, labels must be set.");
        return null;
      }

      return options.labels;
    }

    if (type === AxisDataType.DATE) {
      if (!options.startDate || !options.endDate) {
        console.error("With type DATE, both startDate and endDate must be be set.");
        return null;
      }

      return this.generateDateLabels(options.startDate, options.endDate);
    }


    if (!options.numberRange) {
      console.error("With type NUMBER, numberRange must be be set.");
      return null;
    }

    return this.generateNumberLabels(options.numberRange, options.numberGap);

  }

  generateDateInterval() {
    this.dateIntervalLengths = getIntervalLengths(this.startDate, this.endDate);
    let totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();

    if (this.startDate.getMonth() == 0 || this.startDate.getDate()) {
      totalYears += 1;
    }

    let level = Math.floor(Math.log2(totalYears));
    let daysInAYear = this.dateIntervalLengths[this.dateIntervalLengths.length - 1];

    while (level > 0) {
      daysInAYear *= 2;
      this.dateIntervalLengths.push(daysInAYear);
      level--;
    }
  }

  generateDateLabels(startDate: string | Date, endDate: string | Date) {
    const sd = typeof startDate === "string" ? new Date(startDate) : startDate;
    const ed = typeof endDate === "string" ? new Date(endDate) : endDate;
    this.dateIntervalLengths = getIntervalLengths(sd, ed);
    const dates: dateLevel[] = [];
    travelDates(sd, ed, dates);
    this.dates = dates;
    const labelTexts: string[] = [];
    const firstDays: dateLevel[] = [];

    dates.forEach((date, i) => {
      if (i === 0 || i === dates.length - 1) {
        labelTexts.push(`${date.year} ${monthNames[date.month]} ${date.day}`)

      } else {
        if (date.month === 0 && date.day === 1) {
          labelTexts.push(`${date.year} ${monthNames[date.month]}`);
          firstDays.push(date);
        } else if (date.day === 1) {
          labelTexts.push(`${monthNames[date.month]} ${date.day}`);
        } else {
          labelTexts.push(`${date.day}`);
        }
      }
    })

    let dl = Math.floor(Math.log2(firstDays.length));
    let daysInAYear = this.dateIntervalLengths[this.dateIntervalLengths.length - 1];

    while (dl > 0) {
      const delta = Math.pow(2, dl);
      for (let i = 0; i < firstDays.length; i += delta) {
        firstDays[i].level++;
      }
      daysInAYear *= 2;
      this.dateIntervalLengths.push(daysInAYear);
      dl--;
    }

    return labelTexts;
  }

  generateNumberLabels(numberRange: Vec2, numberGap?: number) {
    let gap = numberGap || 1;
    const labels: string[] = [];

    for (let i = numberRange[0]; i <= numberRange[1]; i += gap) {
      labels.push(i.toString());
    }

    return labels;
  }

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.axisChanged = true;
    this.initChartMetrics();
    this.layoutLabels2();
    this.axisChanged = false;
  }

  layoutLabels() {
    const length = this.labels.length;
    const origin = this.view.origin;
    const tickLength = this.tickLength;
    const labelPadding = this.labelPadding;

    const curScale = 0.5 * Math.pow(2, this.scale);

    if (this.verticalLayout) {
      const h = this.view.size[1];
      const intHeight = h / length;

      let intH = intHeight * curScale;
      let level = 0;
      let lowerInterval = 0;
      let higherInterval = this.interval * 2;

      // Get interval and lowerInterval to for showing labels and ticks
      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        this.interval = 1;

        while (this.interval * intH <= this.maxLabelHeight) {
          // intH *= 2;
          this.interval *= 2;
        }

        if (this.interval != 1) lowerInterval = this.interval / 2;
        higherInterval = this.interval * 2;
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[level];

        while (this.interval * intH <= this.maxLabelHeight) {
          level++;
          this.interval = this.dateIntervalLengths[level];
        }

        if (level > 0) lowerInterval = this.dateIntervalLengths[level - 1];
      }

      const lowerScale = this.maxLabelHeight / (intHeight * this.interval);
      const higherScale = lowerInterval === 0 ?
        this.maxLabelHeight / (intHeight * this.interval * 0.5) :
        this.maxLabelHeight / (intHeight * lowerInterval);

      // To be tested
      for (let i = 0; i < length; i++) {
        const y = origin[1] - (i + 0.5) * intHeight * curScale - this.offset;
        // Label
        const label = this.labelInstances[i];
        const preY = window.innerHeight - label.origin[1];
        const curY = window.innerHeight - y;

        const preIn = preY >= this.viewRange[0] && preY <= this.viewRange[1];
        const curIn = curY >= this.viewRange[0] && curY <= this.viewRange[1];

        label.origin = [origin[0], y];
        label.anchor = {
          padding: labelPadding,
          type: AnchorType.MiddleRight
        };

        // Ticks
        const tick = this.tickLineInstances[i];
        tick.start = [origin[0] - tickLength, y];
        tick.end = [origin[0], y];

        if ((this.type === AxisDataType.LABEL && i % this.interval === 0) ||
          (this.type === AxisDataType.NUMBER && i % this.interval === 0) ||
          (this.type === AxisDataType.DATE && this.dates[i].level >= level)) {
          const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);

          if ((this.type === AxisDataType.LABEL && i % higherInterval === 0) ||
            (this.type === AxisDataType.NUMBER && i % higherInterval === 0) ||
            (this.type === AxisDataType.DATE && this.dates[i].level >= level + 1)) {
            alpha = 1;
          }

          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            alpha
          ];

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
        } else {
          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            0
          ];

          tick.startColor = [
            tick.startColor[0],
            tick.startColor[1],
            tick.startColor[2],
            0
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            0
          ];
        }

        if ((preIn || this.axisChanged) && !curIn) {
          this.providers.labels.remove(label);
          this.providers.ticks.remove(tick);
        } else if ((!preIn || this.axisChanged) && curIn) {
          this.providers.labels.add(label);
          this.providers.ticks.add(tick);
        }
      }
    } else {
      const w = this.view.size[0];
      const intWidth = w / length;

      let intW = intWidth * curScale;
      let level = 0;
      let lowerInterval = 0;
      let higherInterval = this.interval * 2;

      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        this.interval = 1;
        while (this.interval * intW <= this.maxLabelWidth) {
          this.interval *= 2;
        }

        if (this.interval != 1) lowerInterval = this.interval / 2;
        higherInterval = this.interval * 2;
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[level];

        while (this.interval * intW <= this.maxLabelWidth) {
          level++;
          this.interval = this.dateIntervalLengths[level];
        }

        if (level > 0) lowerInterval = this.dateIntervalLengths[level - 1];
      }

      const lowerScale = this.maxLabelWidth / (intWidth * this.interval);
      const higherScale = lowerInterval === 0 ?
        this.maxLabelWidth / (intWidth * this.interval * 0.5) :
        this.maxLabelWidth / (intWidth * lowerInterval);

      for (let i = 0; i < length; i++) {
        const x = origin[0] + (i + 0.5) * intWidth * curScale + this.offset;
        // Label
        const label = this.labelInstances[i];
        const preX = label.origin[0];

        const preIn = preX >= this.viewRange[0] && preX <= this.viewRange[1];
        const curIn = x >= this.viewRange[0] && x <= this.viewRange[1];

        label.origin = [x, origin[1]];
        label.anchor = {
          padding: labelPadding,
          type: AnchorType.TopMiddle
        };

        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [x, origin[1]];
        tick.end = [x, origin[1] + tickLength];

        if ((this.type === AxisDataType.LABEL && i % this.interval === 0) ||
          (this.type === AxisDataType.NUMBER && i % this.interval === 0) ||
          (this.type === AxisDataType.DATE && this.dates[i].level >= level)) {

          const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);

          if ((this.type === AxisDataType.LABEL && i % higherInterval === 0) ||
            (this.type === AxisDataType.NUMBER && i % higherInterval === 0) ||
            (this.type === AxisDataType.DATE && this.dates[i].level >= level + 1)) {
            alpha = 1;
          }

          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            alpha
          ];

          tick.startColor = [
            tick.startColor[0],
            tick.startColor[1],
            tick.startColor[2],
            0.1 + 0.9 * alpha
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            0.1 + 0.9 * alpha
          ];
        } else {
          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            0
          ];

          tick.startColor = [
            tick.startColor[0],
            tick.startColor[1],
            tick.startColor[2],
            0.1
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            0.1
          ];
        }

        if ((preIn || this.axisChanged) && !curIn) {
          this.providers.labels.remove(label);
          this.providers.ticks.remove(tick);
        } else if ((!preIn || this.axisChanged) && curIn) {
          this.providers.labels.add(label);
          this.providers.ticks.add(tick);
        }

      }
    }
  }

  layoutLabels2() {
    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
    }
  }

  updateInterval() {
    const {
      scale,
      unitWidth,
      maxLabelHeight,
      maxLabelWidth,
      preSetMaxWidth,
      preSetMaxHeight
    } = this;

    this.preInterval = this.interval;
    const curScale = 0.5 * Math.pow(2, scale);

    if (this.verticalLayout) {
      const unitH = unitWidth * curScale;
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

    if (oldEnd < start || oldStart > start) {
      // remove [oldStart, oldEnd]
      this.removeBuckets(oldStart, oldEnd, this.preInterval);
    } else {
      if (oldEnd > start && oldStart < start) {
        // remove [oldStart, start]
        this.removeBuckets(oldStart, start, this.preInterval);
      }

      if (oldStart < end && oldEnd > end) {
        // remove [end, oldEnd]
        this.removeBuckets(end, oldEnd, this.preInterval);
      }
    }

    // remove buckets at lower level
    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      if (this.preInterval < this.interval) {
        const s = Math.ceil(start / this.preInterval) * this.preInterval;
        const e = Math.floor(end / this.preInterval) * this.preInterval;

        for (let i = s; i <= e; i += this.preInterval) {
          if (this.bucketMap.has(i) && i % this.interval !== 0) {
            const bucket = this.bucketMap.get(i);
            if (bucket.display) {
              bucket.display = false;
              this.providers.labels.remove(bucket.label);
              this.providers.ticks.remove(bucket.tick);
            }
          }
        }
      }

    } else if (this.type === AxisDataType.DATE) {
      for (let i = start; i <= end; i++) {

        if (this.bucketMap.has(i)) {
          const day = moment(this.startDate).add(i, 'days').toDate();
          const level = getDayLevel(this.startDate, day);

          if (level < this.scaleLevel) {
            const bucket = this.bucketMap.get(i);

            if (bucket.display) {
              bucket.display = false;
              this.providers.labels.remove(bucket.label);
              this.providers.ticks.remove(bucket.tick);
            }
          }

        }
      }

    }

    // update index range
    this.indexRange = [start, end];
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

  bucketMap: Map<number, Bucket> = new Map<number, Bucket>();

  setBucket(index: number, position: Vec2, alpha: number) {
    const {
      labelColor,
      labelPadding,
      labelSize,
      tickLength,
      tickWidth
    } = this;

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
      bucket.tick.end = [position[0], position[1] + tickLength];
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
          }

          if (label.size[0] > this.maxLabelWidth) {
            this.maxLabelWidth = label.size[0];
            if (this.maxLabelWidth > this.preSetMaxWidth) {
              this.updateInterval();
              this.updateIndexRange();
              this.layoutHorizon();
            }
          }
        }
      });

      const tick = new EdgeInstance({
        start: position,
        end: [position[0], position[1] + tickLength],
        thickness: [tickWidth, tickWidth],
        startColor: [1, 1, 1, 0.5 + 0.5 * alpha],
        endColor: [1, 1, 1, 0.5 + 0.5 * alpha]
      })

      const bucket: Bucket = { label, tick, display: true };

      this.bucketMap.set(index, bucket);
      this.providers.labels.add(bucket.label);
      this.providers.ticks.add(bucket.tick);
    }
  }

  layoutLabelOrNumber(lowerScale: number, higherScale: number) {
    const {
      higherInterval,
      interval,
      scale,
      unitWidth,
      view
    } = this;

    const curScale = 0.5 * Math.pow(2, scale);
    const unitW = unitWidth * curScale;
    const origin = view.origin;

    const start = Math.ceil(this.indexRange[0] / interval) * interval;
    const end = Math.floor(this.indexRange[1] / interval) * interval;

    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    for (let i = start; i <= end; i += interval) {
      const x = origin[0] + (i + 0.5) * unitW + this.offset;
      let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
      if (i % higherInterval === 0) alpha = 1;

      this.setBucket(i, [x, origin[1]], alpha);
    }
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

    const curScale = 0.5 * Math.pow(2, scale)
    const unitW = unitWidth * curScale;
    const origin = view.origin;

    const maxBucketWidth = maxLabelWidth === 0 ? preSetMaxWidth : maxLabelWidth;
    const lowerScale = maxBucketWidth / (unitWidth * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketWidth / (unitWidth * interval * 0.5) :
      maxBucketWidth / (unitWidth * lowerInterval);

    const start = Math.ceil(this.indexRange[0] / interval) * interval;
    const end = Math.floor(this.indexRange[1] / interval) * interval;

    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      for (let i = start; i <= end; i += interval) {
        const x = origin[0] + (i + 0.5) * unitW + this.offset;
        let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
        if (i % higherInterval === 0) alpha = 1;

        this.setBucket(i, [x, origin[1]], alpha);
      }
    } else if (this.type === AxisDataType.DATE) {
      this.layoutDateLabels(alphaScale, lowerScale, higherScale);
      /*if (this.scaleLevel <= 7) {
        this.layoutDateLabels(alphaScale, lowerScale, higherScale);
      } else {
        const isFirstDay = this.startDate.getMonth() === 0 && this.startDate.getDate() === 0;
        const firstYear = this.startDate.getFullYear();
        const startYear = isFirstDay ? firstYear : firstYear + 1;
        const endYear = this.endDate.getFullYear();

        const yearInterval = Math.pow(2, this.scaleLevel - 8);
        for (let y = startYear; y <= endYear; y += yearInterval) {
          const firstDay = new Date(y, 0, 1);
          const index = moment(firstDay).diff(moment(this.startDate), 'days');
          const x = origin[0] + (index + 0.5) * unitW + this.offset;
          let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
          if (y % (yearInterval * 2) === 0) alpha = 1;

          this.setBucket(index, [x, origin[1]], alpha);
        }
      }*/


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

    const curScale = 0.5 * Math.pow(2, scale)
    const unitH = unitHeight * curScale;
    const origin = view.origin;

    const maxBucketHeight = maxLabelHeight === 0 ? preSetMaxHeight : maxLabelHeight;
    const lowerScale = maxBucketHeight / (unitHeight * interval);
    const higherScale = lowerInterval === 0 ?
      maxBucketHeight / (unitHeight * interval * 0.5) :
      maxBucketHeight / (unitHeight * lowerInterval);


    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);

    if (this.type === AxisDataType.NUMBER || this.type === AxisDataType.LABEL) {
      const start = Math.ceil(this.indexRange[0] / interval) * interval;
      const end = Math.floor(this.indexRange[1] / interval) * interval;

      for (let i = start; i <= end; i += interval) {
        const y = origin[1] - (i + 0.5) * unitH - this.offset;
        let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
        if (i % higherInterval === 0) alpha = 1;

        this.setBucket(i, [origin[0], y], alpha);
      }
    } else if (this.type === AxisDataType.DATE) {
      if (this.scaleLevel <= 7) {
        this.layoutDateLabels(alphaScale, lowerScale, higherScale);
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

    const sd = moment(this.startDate).add(this.indexRange[0], 'days').toDate();
    const ed = moment(this.startDate).add(this.indexRange[1], 'days').toDate();

    const indices = getIndices(this.startDate, sd, ed, this.scaleLevel);
    console.warn("scale level", this.scaleLevel, "indices", indices);
    // should be modified using, try not to use this
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const day = moment(this.startDate).add(index, 'days').toDate();
      const level = getDayLevel(this.startDate, day);

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

    // year start day
    /*const startDay = moment(this.startDate).add(start, 'days').toDate();
    const endDay = moment(this.startDate).add(end, 'days').toDate();

    const isFirstDay = startDay.getMonth() === 0 && startDay.getDate() === 0;
    const firstYear = startDay.getFullYear();
    const startYear = isFirstDay ? firstYear : firstYear + 1;
    const endYear = endDay.getFullYear();

    const yearInterval = this.scaleLevel >= 8 ? Math.pow(2, this.scaleLevel - 8) : 1;
    console.warn("year intervale", yearInterval);
    for (let y = startYear; y <= endYear; y += yearInterval) {
      const firstDay = new Date(y, 0, 1);
      const index = moment(firstDay).diff(moment(this.startDate), 'days');
      const x = origin[0] + (index + 0.5) * unitW + this.offset;
      let alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
      if (this.scaleLevel < 8 || y % (yearInterval * 2) === 0) alpha = 1;

      this.setBucket(index, [x, origin[1]], alpha);
    }*/
  }

  preInterval: number = 1;
  indexRange: Vec2 = [-1, -1];

  removeBuckets(start: number, end: number, interval: number) {
    const s = Math.ceil(start / interval) * interval;
    const e = Math.floor(end / interval) * interval;

    if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
      for (let i = s; i <= e; i += interval) {
        if (this.bucketMap.has(i)) {
          const bucket = this.bucketMap.get(i);
          bucket.display = false;
          this.providers.labels.remove(bucket.label);
          this.providers.ticks.remove(bucket.tick);
        }
      }
    } else {
      for (let i = start; i <= end; i++) {
        const day = moment(this.startDate).add(i, 'days').toDate();

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

  }

  removeDateBuckets(startDate: Date, endDate: Date, scaleLevel: number) {
    for (let i = 0; i < this.unitNumber; i++) {
      const day = moment(startDate).add(i, 'days').toDate();
      const level = getDayLevel(this.startDate, day);

      if (level === scaleLevel) {

        if (this.bucketMap.get(i)) {
          const bucket = this.bucketMap.get(i);

          if (bucket.display) {
            bucket.display = false;
            this.providers.labels.remove(bucket.label);
            this.providers.ticks.remove(bucket.tick);
          }
        }
      }
    }
  }

  //
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
    this.layoutLabels2();
  }
}
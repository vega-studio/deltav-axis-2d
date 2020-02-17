import { InstanceProvider, EdgeInstance, LabelInstance, Color, AnchorType } from "deltav";
import { AxisDataType, Vec2, Vec3 } from "src/types";
import { dateLevel, travelDates, getIntervalLengths } from "src/util/dateUtil";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface IAxisStoreOptions {
  origin: Vec2;
  size: Vec2;
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
  verticalLayout: boolean = true;
  axisChanged: boolean = false;

  // data type
  type: AxisDataType;

  // Shape Instances Holders
  labelInstances: LabelInstance[] = [];
  tickLineInstances: EdgeInstance[] = [];

  // Axis Metrics
  origin: Vec2;
  size: Vec2;
  tickWidth: number = 1;
  tickLength: number = 10;

  // Label Metrics
  labelSize: number = 12;
  labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  labelPadding: number = 10;
  maxLabelWidth: number = 0;
  maxLabelHeight: number = 0;
  maxLabelLengh: number = 15;

  labels: string[];

  dates: dateLevel[];

  // Range
  maxRange: Vec2;
  viewRange: Vec2;

  offset: number = 0;
  scale: number = 1;

  // Interval info
  interval: number = 1;
  dateIntervalLengths: number[];


  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.origin = options.origin;
    this.size = options.size || [100, 100];
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.type = options.type;
    this.labels = this.generateLabelTexts(options);

    Object.assign(this.providers, options.providers);

    this.init();
  }

  init() {
    this.updateChartMetrics();
    const origin = this.origin;
    const w = this.size[0];
    const h = this.size[1];
    const tickLength = this.tickLength;
    const tickWidth = this.tickWidth;
    const labelPadding = this.labelPadding;
    const length = this.labels.length;

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
                this.updateChartMetrics();
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
    this.updateChartMetrics();
    this.layoutLabels();
    this.axisChanged = false;
  }

  layoutLabels() {
    const length = this.labels.length;
    const origin = this.origin;
    const tickLength = this.tickLength;
    const labelPadding = this.labelPadding;

    if (this.verticalLayout) {
      const h = this.size[1];
      const intHeight = h / length;

      let intH = intHeight * this.scale;
      let level = 0;
      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        this.interval = 1;

        while (intH <= this.maxLabelHeight) {
          intH *= 2;
          this.interval *= 2;
        }
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[level];

        while (this.interval * intH <= this.maxLabelHeight) {
          level++;
          this.interval = this.dateIntervalLengths[level];
        }
      }


      // To be tested
      for (let i = 0; i < length; i++) {
        const y = origin[1] - (i + 0.5) * intHeight * this.scale - this.offset;
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
        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [origin[0] - tickLength, y];
        tick.end = [origin[0], y];

        if ((this.type === AxisDataType.LABEL && i % this.interval === 0) ||
          (this.type === AxisDataType.NUMBER && i % this.interval === 0) ||
          (this.type === AxisDataType.DATE && this.dates[i].level >= level)) {
          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            1
          ];

          tick.startColor = [
            tick.startColor[0],
            tick.startColor[1],
            tick.startColor[2],
            1
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            1
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
            0.5
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            0.5
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
      const w = this.size[0];
      const intWidth = w / length;

      let intW = intWidth * this.scale;
      let level = 0;

      if (this.type === AxisDataType.LABEL || this.type === AxisDataType.NUMBER) {
        this.interval = 1;
        while (intW <= this.maxLabelWidth) {
          intW *= 2;
          this.interval *= 2;
        }
      } else if (this.type === AxisDataType.DATE) {
        this.interval = this.dateIntervalLengths[level];

        while (this.interval * intW <= this.maxLabelWidth) {
          level++;
          this.interval = this.dateIntervalLengths[level];
        }

      }

      for (let i = 0; i < length; i++) {
        const x = origin[0] + (i + 0.5) * intWidth * this.scale + this.offset;
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
          label.color = [
            label.color[0],
            label.color[1],
            label.color[2],
            1
          ];

          tick.startColor = [
            tick.startColor[0],
            tick.startColor[1],
            tick.startColor[2],
            1
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            1
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
            0.5
          ];

          tick.endColor = [
            tick.endColor[0],
            tick.endColor[1],
            tick.endColor[2],
            0.5
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

  updateChartMetrics() {
    const origin = this.origin;
    const width = this.size[0];
    const height = this.size[1];

    if (this.verticalLayout) {
      this.viewRange = [
        window.innerHeight - origin[1],
        window.innerHeight - origin[1] + height
      ];
      this.maxRange = [
        window.innerHeight - origin[1],
        window.innerHeight - origin[1] + height
      ];
    } else {
      this.viewRange = [origin[0], origin[0] + width];
      this.maxRange = [origin[0], origin[0] + width];
    }

    this.scale = 1;
    this.offset = this.maxRange[0] - this.viewRange[0];
  }

  // Only update viewRange , then update offset and scale
  updateScale(mouse: Vec2, scale: Vec3) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.max(newScale, 1);
    const width = this.size[0];
    const height = this.size[1];

    if (this.verticalLayout) {
      const downY = this.maxRange[0];
      const upY = this.maxRange[1];
      const vd = this.viewRange[0];
      const vu = this.viewRange[1];
      const pointY = Math.min(Math.max(vd, window.innerHeight - mouse[1]), vu);
      const newHeight = height * this.scale;
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
      const newWidth = width * this.scale;
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

  updateMaxRange(left: number, right: number, width: number) {
    if (left >= this.viewRange[0] && right <= this.viewRange[1]) {
      left = this.viewRange[0];
      right = this.viewRange[1];
    } else if (left >= this.viewRange[0]) {
      left = this.viewRange[0];
      right = left + width;
    } else if (right <= this.viewRange[1]) {
      right = this.viewRange[1];
      left = right - width;
    }

    this.maxRange = [left, right];
    this.offset = this.maxRange[0] - this.viewRange[0];

    this.layoutLabels();
  }
}
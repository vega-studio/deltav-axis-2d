import { InstanceProvider, EdgeInstance, LabelInstance, Color, AnchorType } from "deltav";

export interface IAxisStoreOptions {
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  },
  width: number;
  height: number;
  labelColor?: Color;
  labelSize?: number;
  labelHighlightColor?: Color;
  lineWidth: number;
  labels: string[];
}

export class AxisStore {
  // Layout mode
  verticalLayout: boolean = false;

  // Shape Instances Holders
  xAxisLine: EdgeInstance;
  yAxisLine: EdgeInstance;
  labelInstances: LabelInstance[] = [];
  tickLineInstances: EdgeInstance[] = [];

  // Axis Metrics
  width: number;
  height: number;
  axisWidth: number;
  axisHeight: number;
  origin: [number, number];
  lineWidth: number = 1;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  // Label Metrics
  labelSize: number = 12;
  labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  maxLabelWidth: number = 0;
  maxLabelHeight: number = 0;
  maxLabelLengh: number = 10;

  labels: string[];

  // Range
  maxRange: [number, number];
  viewRange: [number, number];

  offset: number = 0;
  scale: number = 1;

  providers = {
    axis: new InstanceProvider<EdgeInstance>(),
    lines: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.width = options.width;
    this.height = options.height;
    this.padding = options.padding;
    this.lineWidth = options.lineWidth || this.lineWidth;
    this.labels = options.labels;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;

    this.init();
  }

  init() {
    this.updateChartMetrics();
    const origin = this.origin;
    const w = this.axisWidth;
    const h = this.axisHeight;
    const lineWidth = this.lineWidth;

    // x direction Line
    this.xAxisLine = this.providers.axis.add(new EdgeInstance({
      start: origin,
      end: [origin[0] + w, origin[1]],
      thickness: [lineWidth, lineWidth]
    }));

    // y direction Line
    this.yAxisLine = this.providers.axis.add(new EdgeInstance({
      start: origin,
      end: [origin[0], origin[1] - h],
      thickness: [lineWidth, lineWidth]
    }));

    const length = this.labels.length;

    if (length != 0) {
      if (this.verticalLayout) {
        const intHeight = h / length;

        for (let i = 0; i < length; i++) {
          const y = origin[1] - (i + 0.5) * intHeight * this.scale + this.offset;
          // tickLine
          const tick = new EdgeInstance({
            start: [origin[0], y],
            end: [origin[0] - 10, y], /// Needs a tick length
            thickness: [1, 1],
            startColor: [1, 1, 1, 0.5],
            endColor: [1, 1, 1, 0.5]
          });

          this.tickLineInstances.push(tick);
          // label
          const label = new LabelInstance({
            anchor: {
              padding: 10,
              type: AnchorType.MiddleRight
            },
            color: this.labelColor,
            fontSize: this.labelSize,
            origin: [origin[0], y],
            text: this.labels[i],
            onReady: label => {
              if (label.size[0] > this.maxLabelWidth) {
                this.maxLabelWidth = label.size[0];
                this.updateChartMetrics();
                this.layoutLines();
                this.layoutLabels();
              }

              if (label.size[1] > this.maxLabelHeight) {
                this.maxLabelHeight = label.size[0];
                this.layoutLabels();
              }
            }
          });

          this.labelInstances.push(label);

          const curY = this.height - y;
          if (curY >= this.viewRange[0] && curY <= this.viewRange[1]) {
            this.providers.lines.add(tick);
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
            end: [x, origin[1] + 10],
            thickness: [this.lineWidth, this.lineWidth],
          });

          this.tickLineInstances.push(tick);

          const labelText = this.labels[i];
          const text = labelText.length > this.maxLabelLengh ?
            labelText.substr(0, this.maxLabelLengh) : labelText;

          // label
          const label = new LabelInstance({
            anchor: {
              padding: 10,
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
            this.providers.lines.add(tick);
            this.providers.labels.add(label);
          }
        }
      }
    }
  }

  layoutLines() {
    this.xAxisLine.start = this.origin;
    this.xAxisLine.end = [this.origin[0] + this.axisWidth, this.origin[1]];
    this.yAxisLine.start = this.origin;
    this.yAxisLine.end = [this.origin[0], this.origin[1] - this.axisHeight];
  }

  interval: number = 1;

  layoutLabels() {
    const length = this.labels.length;
    const origin = this.origin;

    if (this.verticalLayout) {
      const h = this.axisHeight;
      const intHeight = h / length;

      let intH = intHeight * this.scale;
      this.interval = 1;

      while (intH <= this.maxLabelHeight) {
        intH *= 2;
        this.interval *= 2;
      }

      // To be tested
      for (let i = 0; i < length; i++) {
        const y = origin[1] - (i + 0.5) * intHeight * this.scale - this.offset;
        // Label
        const label = this.labelInstances[i];
        const preY = this.height - label.origin[1];
        const curY = this.height - y;

        const preIn = preY >= this.viewRange[0] && preY <= this.viewRange[1];
        const curIn = curY >= this.viewRange[0] && curY <= this.viewRange[1];

        label.origin = [origin[0], y];
        label.anchor = {
          padding: 10,
          type: AnchorType.MiddleRight
        };
        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [origin[0] - 10, y];
        tick.end = [origin[0], y];

        if (i % this.interval === 0) {
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

        if (preIn && !curIn) {
          this.providers.labels.remove(label);
          this.providers.lines.remove(tick);
        } else if (!preIn && curIn) {
          this.providers.labels.add(label);
          this.providers.lines.add(tick);
        }
      }
    } else {
      const w = this.axisWidth;
      const intWidth = w / length;

      let intW = intWidth * this.scale;
      this.interval = 1;

      while (intW <= this.maxLabelWidth) {
        intW *= 2;
        this.interval *= 2;
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
          padding: 10,
          type: AnchorType.TopMiddle
        };

        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [x, origin[1]];
        tick.end = [x, origin[1] + 10];

        if (i % this.interval === 0) {
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

        if (preIn && !curIn) {
          this.providers.labels.remove(label);
          this.providers.lines.remove(tick);
        } else if (!preIn && curIn) {
          this.providers.labels.add(label);
          this.providers.lines.add(tick);
        }

      }
    }
  }

  updateChartMetrics() {
    const {
      padding,
      width,
      height
    } = this;

    const lp = padding.left * width;
    const rp = padding.right * width;
    const tp = padding.top * height;
    const bp = padding.bottom * height;
    this.axisHeight = height - tp - bp;

    if (this.verticalLayout) {
      this.axisWidth = width - lp - rp - this.maxLabelWidth;
      this.origin = [lp + this.maxLabelWidth, height - bp];
      this.viewRange = [bp, bp + this.axisHeight];
      this.maxRange = [bp, bp + this.axisHeight];
    } else {
      this.axisWidth = width - lp - rp;
      this.origin = [lp, height - bp];
      this.viewRange = [lp, lp + this.axisWidth];
      this.maxRange = [lp, lp + this.axisWidth];
    }
  }


  // Only update viewRange , then update offset and scale
  updateScale(mouse: [number, number], scale: [number, number, number]) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.max(newScale, 1);

    if (this.verticalLayout) {
      const downY = this.maxRange[0];
      const upY = this.maxRange[1];
      const vd = this.viewRange[0];
      const vu = this.viewRange[1];
      const pointY = Math.min(Math.max(vd, this.height - mouse[1]), vu);
      const newHeight = this.axisHeight * this.scale;
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
      const newWidth = this.axisWidth * this.scale;
      const leftWidth = (pointX - leftX) * newWidth / (rightX - leftX);
      let newLeftX = pointX - leftWidth;
      let newRightX = newLeftX + newWidth;
      this.updateMaxRange(newLeftX, newRightX, newWidth);
    }
  }

  updateOffset(offset: [number, number, number]) {
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
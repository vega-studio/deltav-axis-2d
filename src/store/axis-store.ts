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
  verticalLayout: boolean = true;

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
          const tick = this.providers.lines.add(new EdgeInstance({
            start: [origin[0], y],
            end: [origin[0] - 10, y], /// Needs a tick length
            thickness: [1, 1]
          }));
          this.tickLineInstances.push(tick);
          // label
          const label = this.providers.labels.add(new LabelInstance({
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
            }
          }))
          this.labelInstances.push(label);
        }
      } else {
        const intWidth = w / length;

        for (let i = 0; i < length; i++) {
          const x = origin[0] + (i + 0.5) * intWidth * this.scale + this.offset;
          // tickLine
          const tick = this.providers.lines.add(new EdgeInstance({
            start: [x, origin[1]],
            end: [x, origin[1] + 10],
            thickness: [1, 1]
          }));
          this.tickLineInstances.push(tick);
          // label
          const label = this.providers.labels.add(new LabelInstance({
            anchor: {
              padding: 2,
              type: AnchorType.TopMiddle
            },
            color: this.labelColor,
            fontSize: this.labelSize,
            origin: [x, origin[1] + 10],
            text: this.labels[i],
          }))
          this.labelInstances.push(label);
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

  layoutLabels() {
    const length = this.labels.length;
    const origin = this.origin;

    if (this.verticalLayout) {
      const h = this.axisHeight;
      const intHeight = h / length;

      // To be tested
      for (let i = 0; i < length; i++) {
        const y = origin[1] - (i + 0.5) * intHeight * this.scale - this.offset;
        // Label
        const label = this.labelInstances[i];
        label.origin = [origin[0], y];
        label.anchor = {
          padding: 10,
          type: AnchorType.MiddleRight
        };
        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [origin[0] - 10, y];
        tick.end = [origin[0], y];
      }
    } else {
      const w = this.axisWidth;
      const intWidth = w / length;

      for (let i = 0; i < length; i++) {
        const x = origin[0] + (i + 0.5) * intWidth * this.scale + this.offset;

        // Label
        const label = this.labelInstances[i];
        label.origin = [x, origin[1]];
        label.anchor = {
          padding: 2,
          type: AnchorType.TopMiddle
        };

        // Tick
        const tick = this.tickLineInstances[i];
        tick.start = [x, origin[1]];
        tick.end = [x, origin[1] + 10];
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
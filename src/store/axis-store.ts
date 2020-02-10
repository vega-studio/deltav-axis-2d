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
  labelfont?: string;
  labelHighlightColor?: Color;
  lineWidth?: number;
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

  labels: string[];

  // Range
  maxRange: [number, number];
  viewRange: [number, number];

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
      const intWid = w / length;
      for (let i = 0; i < length; i++) {
        const x = (origin[0] + (i + 0.5) * intWid) * this.scale + this.offset;
        // tickLine
        const tick = this.providers.lines.add(new EdgeInstance({
          start: [x, origin[1]],
          end: [x, origin[1] + 10],
          thickness: [1, 1]
        }));
        this.tickLineInstances.push(tick);
        // label
        const label = this.providers.labels.add(new LabelInstance({
          text: this.labels[i],
          origin: [x, origin[1] + 10],
          color: this.labelColor,
          anchor: {
            padding: 2,
            type: AnchorType.TopMiddle
          }
        }))
        this.labelInstances.push(label);
      }
    }
  }

  layoutLabels() {
    const length = this.labels.length;
    const origin = this.origin;
    const w = this.axisWidth;
    const intWid = w / length;

    for (let i = 0; i < length; i++) {
      const x = origin[0] + (i + 0.5) * intWid * this.scale + this.offset;
      const label = this.labelInstances[i];
      label.origin = [x, label.origin[1]];
      const tick = this.tickLineInstances[i];
      tick.start = [x, tick.start[1]];
      tick.end = [x, tick.end[1]];
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

    this.axisWidth = width - lp - rp;
    this.axisHeight = height - tp - bp;
    this.origin = [lp, height - bp];

    this.viewRange = [lp, lp + this.axisWidth];
    this.maxRange = [lp, lp + this.axisWidth];
  }

  offset: number = 0;
  scale: number = 1;

  // Only update viewRange , then update offset and scale
  updateScale(mouseX: number, scale: number) {
    const leftX = this.maxRange[0];
    const rightX = this.maxRange[1];
    const vl = this.viewRange[0];
    const vr = this.viewRange[1];
    const pointX = Math.min(Math.max(vl, mouseX), vr);
    this.scale = Math.max(scale, 1);
    const newWidth = this.axisWidth * this.scale;
    const leftWidth = (pointX - leftX) * newWidth / (rightX - leftX);
    let newLeftX = pointX - leftWidth;
    let newRightX = newLeftX + newWidth;

    this.updateMaxRange(newLeftX, newRightX, newWidth);
  }

  updateOffset(offset: number) {
    const leftX = this.maxRange[0] + offset;
    const rightX = this.maxRange[1] + offset;
    const width = this.maxRange[1] - this.maxRange[0];

    this.updateMaxRange(leftX, rightX, width);
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

    console.log("")
    this.layoutLabels();
  }
}
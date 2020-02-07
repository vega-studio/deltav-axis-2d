import { InstanceProvider, EdgeInstance, LabelInstance, Color } from "deltav";

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
}

export class AxisStore {
  // Layout mode
  verticalLayout: boolean = false;

  // Shape Instances Holders
  xAxisLine: EdgeInstance;
  yAxisLine: EdgeInstance;
  labelInstances: LabelInstance[] = [];

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

  providers = {
    lines: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IAxisStoreOptions) {
    this.width = options.width;
    this.height = options.height;
    this.padding = options.padding;
    this.lineWidth = options.lineWidth || this.lineWidth;

    this.init();
  }

  init() {
    this.updateChartMetrics();
    const origin = this.origin;
    const w = this.axisWidth;
    const h = this.axisHeight;
    const lineWidth = this.lineWidth;

    // x direction Line
    this.xAxisLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0] + w, origin[1]],
      thickness: [lineWidth, lineWidth]
    }));

    // y direction Line
    this.yAxisLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0], origin[1] - h],
      thickness: [lineWidth, lineWidth]
    }));
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
  }
}
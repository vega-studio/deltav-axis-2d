import { Color, Vec2, InstanceProvider, EdgeInstance, LabelInstance, Vec3, AnchorType } from "deltav";
import { Bucket } from "./bucket";
import { HorizonRangeLayout, VerticalRangeLayout, AxisDataType } from "src/types";
import moment from "moment";

export interface IBasicAxisStoreOptions<T extends number | string | Date> {
  labelColor?: Color;
  labelPadding?: number;
  labelSize?: number; providers?: {
    ticks?: InstanceProvider<EdgeInstance>,
    labels?: InstanceProvider<LabelInstance>
  };
  resizeWithWindow?: boolean;
  tickLength?: number;
  tickWidth?: number;
  verticalLayout?: boolean;
  displayRangeLabels?: boolean;
  horizonLayoutRange?: HorizonRangeLayout;
  verticalLayoutRange?: VerticalRangeLayout;
  view: {
    origin: Vec2;
    size: Vec2;
  };
  onDisplayRange?: (displayRange: [T, T]) => [string, string];
  onTickInstance?: (instance: EdgeInstance) => void;
  onMainLabelInstance?: (instance: LabelInstance) => void;
  onSubLabelInstance?: (instance: LabelInstance) => void;
}


export abstract class BasicAxisStore<T extends number | string | Date> {
  verticalLayout: boolean = true;
  resizeWithWindow: boolean = true;
  displayRangeLabels: boolean = true;
  horizonLayoutRange: HorizonRangeLayout = HorizonRangeLayout.ABOVE;
  verticalLayoutRange: VerticalRangeLayout = VerticalRangeLayout.LEFT;

  // Axis Metrics
  view: {
    origin: Vec2;
    size: Vec2;
  }
  windowWidth: number;
  windowHeight: number;

  // Tick Metrics
  tickWidth: number = 1;
  tickLength: number = 10;

  // Label Metrics
  labelSize: number = 12;
  labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  labelPadding: number = 10;
  maxLabelLength: number = 10;
  maxLabelWidth: number = 0;
  maxLabelHeight: number = 0;
  preSetMaxWidth: number = 0;
  preSetMaxHeight: number = 0;

  // View Range
  maxRange: Vec2;
  viewRange: Vec2;
  indexRange: Vec2 = [-1, -1];
  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;
  offset: number = 0;
  scale: number = 1;

  // Interval info
  interval: number = 1;
  lowerInterval: number = 0;

  bucketMap: Map<number, Bucket> = new Map<number, Bucket>();
  auxLines: EdgeInstance[] = [];
  headLabel: LabelInstance;
  tailLabel: LabelInstance;

  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  mainLabelHandler = (_label: LabelInstance) => { };
  subLabelHandler = (_label: LabelInstance) => { };
  tickHandler = (_tick: EdgeInstance) => { };

  rangeHandler = (values: [T, T]) => {
    if (typeof values[0] === 'number' && typeof values[1] === 'number') {
      return [values[0].toFixed(2), values[1].toFixed(2)] as [string, string];
    } else if (
      values[0] instanceof Date && values[1] instanceof Date
    ) {
      return [
        moment(values[0]).format("MMM DD YYYY, kk:mm:ss"),
        moment(values[1]).format("MMM DD YYYY, kk:mm:ss")
      ]
    } else if (
      typeof values[0].toString === 'function' &&
      typeof values[1].toString === 'function'
    ) {
      return [values[0].toString(), values[1].toString()] as [string, string];
    }

    return ["", ""] as [string, string];
  };

  labelReady = (text: string) => new Promise((resolve) => {
    const atlasLabel = new LabelInstance({
      text,
      fontSize: this.labelSize,
      origin: [-100, -100],
      color: [0, 0, 0, 0],
      onReady: () => {
        resolve(text);
      }
    })

    this.providers.labels.add(atlasLabel);
  })

  constructor(options: IBasicAxisStoreOptions<T>) {
    this.view = options.view;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelSize = options.labelSize || this.labelSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.verticalLayout = options.verticalLayout !== undefined ?
      options.verticalLayout : this.verticalLayout;
    this.resizeWithWindow = options.resizeWithWindow !== undefined ?
      options.resizeWithWindow : this.resizeWithWindow;
    this.displayRangeLabels = options.displayRangeLabels !== undefined ?
      options.displayRangeLabels : this.displayRangeLabels;
    this.horizonLayoutRange = options.horizonLayoutRange || this.horizonLayoutRange;
    this.verticalLayoutRange = options.verticalLayoutRange || this.verticalLayoutRange;
    this.rangeHandler = options.onDisplayRange || this.rangeHandler;
    this.mainLabelHandler = options.onMainLabelInstance || this.mainLabelHandler;
    this.subLabelHandler = options.onSubLabelInstance || this.subLabelHandler;
    this.tickHandler = options.onTickInstance || this.tickHandler;

    Object.assign(this.providers, options.providers);

    this.initIndexRange(options);
    this.init();
  }

  abstract async setAtlasLabel(): Promise<any>;
  abstract getMainLabel(index: number): string;
  abstract getSubLabel(index: number): string;
  abstract getPreSetWidth(): number;
  abstract getPreSetHeight(): number;
  abstract initIndexRange(options: IBasicAxisStoreOptions<T>): void;
  abstract layoutHorizon(): void;
  abstract layoutVertical(): void;
  abstract posToDomain(pos: number): T;
  abstract removeBuckets(start: number, end: number): void;
  abstract removeBucketsAtLowerLevels(start: number, end: number): void;
  abstract updateInterval(): void;

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.indexRange = [0, this.unitNumber - 1];
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  drawAuxilaryLines() {
    const origin = this.view.origin;
    const size = this.view.size;

    if (this.auxLines.length === 0) {
      const line1 = new EdgeInstance({
        start: origin,
        end: this.verticalLayout ?
          [origin[0] - 40, origin[1]] : [origin[0], origin[1] - 40],
        startColor: [1, 0, 0, 1],
        endColor: [1, 0, 0, 1]
      })

      const line2 = new EdgeInstance({
        start: this.verticalLayout ?
          [origin[0], origin[1] - size[1]] : [origin[0] + size[0], origin[1]],
        end: this.verticalLayout ?
          [origin[0] - 40, origin[1] - size[1]] : [origin[0] + size[0], origin[1] - 40],
        startColor: [1, 0, 0, 1],
        endColor: [1, 0, 0, 1]
      })

      this.auxLines.push(line1);
      this.auxLines.push(line2);
      this.providers.ticks.add(line1);
      this.providers.ticks.add(line2);
    } else {
      this.auxLines[0].start = origin;
      this.auxLines[0].end = this.verticalLayout ?
        [origin[0] - 40, origin[1]] : [origin[0], origin[1] - 40];
      this.auxLines[1].start = this.verticalLayout ?
        [origin[0], origin[1] - size[1]] : [origin[0] + size[0], origin[1]];
      this.auxLines[1].end = this.verticalLayout ?
        [origin[0] - 40, origin[1] - size[1]] : [origin[0] + size[0], origin[1] - 40];

      this.providers.ticks.add(this.auxLines[0]);
      this.providers.ticks.add(this.auxLines[1]);
    }
  }

  async getRangeLabels() {
    if (this.displayRangeLabels) {
      const rangeValues: [T, T] =
        [this.posToDomain(this.viewRange[0]), this.posToDomain(this.viewRange[1])];
      const values = this.rangeHandler(rangeValues);
      const headText = `${values[0]}`;
      const tailText = `${values[1]}`;

      const padding =
        this.verticalLayout ?
          this.verticalLayoutRange === VerticalRangeLayout.LEFT ?
            this.labelPadding : this.labelPadding :
          this.horizonLayoutRange === HorizonRangeLayout.BELOW ?
            this.labelPadding + 2 * this.labelSize : this.labelPadding;

      const headOrigin: [number, number] =
        this.verticalLayout ?
          this.verticalLayoutRange === VerticalRangeLayout.LEFT ?
            [this.view.origin[0] - padding, this.view.origin[1]] :
            [this.view.origin[0] + padding, this.view.origin[1]] :
          this.horizonLayoutRange === HorizonRangeLayout.BELOW ?
            [this.view.origin[0], this.view.origin[1] + padding] :
            [this.view.origin[0], this.view.origin[1] - padding];

      const tailOrigin: [number, number] =
        this.verticalLayout ?
          this.verticalLayoutRange === VerticalRangeLayout.LEFT ?
            [this.view.origin[0] - padding, this.view.origin[1] - this.view.size[1]] :
            [this.view.origin[0] + padding, this.view.origin[1] - this.view.size[1]] :
          this.horizonLayoutRange === HorizonRangeLayout.BELOW ?
            [this.view.origin[0] + this.view.size[0], this.view.origin[1] + padding] :
            [this.view.origin[0] + this.view.size[0], this.view.origin[1] - padding];

      const headAnchorType =
        this.verticalLayout ?
          this.verticalLayoutRange === VerticalRangeLayout.LEFT ?
            AnchorType.BottomRight : AnchorType.BottomLeft :
          this.horizonLayoutRange === HorizonRangeLayout.BELOW ?
            AnchorType.TopLeft : AnchorType.BottomLeft;

      const tailAnchorType =
        this.verticalLayout ?
          this.verticalLayoutRange === VerticalRangeLayout.LEFT ?
            AnchorType.TopRight : AnchorType.TopLeft :
          this.horizonLayoutRange === HorizonRangeLayout.BELOW ?
            AnchorType.TopRight : AnchorType.BottomRight;

      if (this.headLabel) {
        this.headLabel.anchor = {
          padding: 0,
          type: headAnchorType
        };
        this.headLabel.origin = headOrigin;
        this.headLabel.text = headText;
      } else {
        this.headLabel = new LabelInstance({
          anchor: {
            padding: 0,
            type: headAnchorType
          },
          color: [1, 1, 1, 0.5],
          fontSize: this.labelSize,
          text: headText,
          origin: headOrigin
        });
      }

      if (this.tailLabel) {
        this.tailLabel.text = tailText;
        this.tailLabel.anchor = {
          padding: 0,
          type: tailAnchorType
        };
        this.tailLabel.origin = tailOrigin;
      } else {
        this.tailLabel = new LabelInstance({
          anchor: {
            padding: 0,
            type: tailAnchorType
          },
          color: [1, 1, 1, 0.5],
          fontSize: this.labelSize,
          text: tailText,
          origin: tailOrigin
        });
      }

      this.providers.labels.add(this.headLabel);
      this.providers.labels.add(this.tailLabel);
    }

  };

  async init() {
    this.initChartMetrics();
    this.drawAuxilaryLines();
    this.updateInterval();
    await this.setAtlasLabel();
    this.layoutLabels();
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
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  }

  layoutLabels() {
    if (this.verticalLayout) {
      this.layoutVertical();
    } else {
      this.layoutHorizon();
    }

    this.getRangeLabels();
  }

  onLabelReady = (label: LabelInstance) => {
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

  removeAll() {
    this.bucketMap.forEach(bucket => {
      if (bucket.showLabels) {
        bucket.showLabels = false;
        if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
        if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
      }

      if (bucket.showTick) {
        bucket.showTick = false;
        if (bucket.tick) this.providers.ticks.remove(bucket.tick);
      }
    })

    this.bucketMap.clear();
    this.providers.labels.clear();
    this.providers.ticks.clear();
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

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.view = view;
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
    this.lowerInterval = 0;
    this.interval = 1;

    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  updateIndexRange() {
    const curScale = 0.5 * Math.pow(2, this.scale)
    const unit = this.verticalLayout ? this.unitHeight * curScale : this.unitWidth * curScale;
    const start = Math.floor((this.viewRange[0] - this.maxRange[0]) / unit);
    const end = Math.ceil((this.viewRange[1] - this.maxRange[0]) / unit);
    const oldStart = this.indexRange[0];
    const oldEnd = this.indexRange[1];

    if (oldEnd < start || oldStart > end) {
      this.removeBuckets(oldStart, oldEnd);
    } else {
      if (oldEnd >= start && oldStart < start) {
        this.removeBuckets(oldStart, start);
      }

      if (oldStart <= end && oldEnd > end) {
        this.removeBuckets(end, oldEnd);
      }
    }

    this.removeBucketsAtLowerLevels(start, end);
    this.indexRange = [start, end];
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

  updateOffset(offset: Vec3) {
    const lo = this.maxRange[0] + (this.verticalLayout ? -offset[1] : offset[0]);
    const hi = this.maxRange[1] + (this.verticalLayout ? -offset[1] : offset[0]);
    const range = this.maxRange[1] - this.maxRange[0];
    this.updateMaxRange(lo, hi, range);
  }

  updateScale(mouse: Vec2, scale: Vec3) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.min(Math.max(newScale, 1), Math.log2(2 * this.unitNumber));
    const curScale = 0.5 * Math.pow(2, this.scale);
    const pointY = Math.min(Math.max(this.viewRange[0], window.innerHeight - mouse[1]), this.viewRange[1]);
    const pointX = Math.min(Math.max(this.viewRange[0], mouse[0]), this.viewRange[1]);
    const point = this.verticalLayout ? pointY : pointX;
    const newRange = (this.verticalLayout ? this.view.size[1] : this.view.size[0]) * curScale;
    const lowPart = (point - this.maxRange[0]) * newRange / (this.maxRange[1] - this.maxRange[0]);
    const low = point - lowPart;
    const high = low + newRange;

    this.updateMaxRange(low, high, newRange);
  }

}
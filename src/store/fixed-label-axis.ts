import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import { Color, InstanceProvider, EdgeInstance, LabelInstance, Vec2 } from "deltav";
import { Bucket } from "./bucket";

export interface IFixedLabelAxisStoreOptions {
  /** Sets the labels to show for the axis */
  labels: string[];
  /** Sets the max amount of letters in a label */
  maxLabelLength?: number;
  /** Sets the color of labels */
  labelColor?: Color;
  /** Sets the fontsize of labels */
  labelFontSize?: number;
  /** Sets the padding value of labels */
  labelPadding?: number;
  /** Sets the provides for ticks and labels */
  providers?: {
    ticks?: InstanceProvider<EdgeInstance>,
    labels?: InstanceProvider<LabelInstance>
  };
  /** Sets the color of ticks */
  tickColor?: Color;
  /** Sets the length of ticks */
  tickLength?: number;
  /** Sets the thickness of the ticks */
  tickWidth?: number;
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
  /** Sets the origin and size([width, height]) of the axis*/
  view: {
    origin: Vec2;
    size: Vec2;
  };
  /** Callback when the tickInstances are ready */
  onTickInstance?: (instance: EdgeInstance) => void;
  /** Callback when the main labelInstances are ready */
  onLabelInstance?: (instance: LabelInstance) => void;
}

export class FixedLabelAxis {
  private labels: string[] = [];
  private maxLabelLength: number = 10;

  // Tick Metrics
  protected tickWidth: number = 1;
  protected tickLength: number = 10;
  protected tickColor: Color = [1, 1, 1, 1];

  // Label Metrics
  protected labelFontSize: number = 12;
  protected labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  protected labelPadding: number = 10;

  protected unitNumber: number;
  protected unitWidth: number;
  protected unitHeight: number;

  protected verticalLayout: boolean = false;
  // Axis Metrics
  protected view: {
    origin: Vec2;
    size: Vec2;
  }

  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  labelHandler = (_label: LabelInstance) => { };
  tickHandler = (_tick: EdgeInstance) => { };

  constructor(options: IFixedLabelAxisStoreOptions) {
    this.view = options.view;
    this.tickColor = options.tickColor || this.tickColor;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelFontSize = options.labelFontSize || this.labelFontSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;

    this.labelHandler = options.onLabelInstance || this.labelHandler;
    this.tickHandler = options.onTickInstance || this.tickHandler;

    Object.assign(this.providers, options.providers);
    Object.assign(this.labels, options.labels);

    const unitNumber = options.labels.length;
    this.unitWidth = this.view.size[0] / unitNumber;
    this.unitHeight = this.view.size[1] / unitNumber;

    this.layout();
  }

  layout() {
    const origin = this.view.origin;


    for (let i = 0; i < this.labels.length; i++) {
      const pos: Vec2 = this.verticalLayout ?
        [origin[0], origin[1] - (i + 0.5) * this.unitHeight] :
        [origin[0] + (i + 0.5) * this.unitWidth, origin[1]];

      const bucket: Bucket = new Bucket({
        labelColor: this.labelColor,
        labelFontSize: this.labelFontSize,
        tickColor: this.tickColor,
        tickLength: this.tickLength,
        tickWidth: this.tickWidth,
        onMainLabelInstance: this.labelHandler,
        onSubLabelInstance: () => { },
        onTickInstance: this.tickHandler
      })

      const text = this.labels[i];
      bucket.createMainLabel(text, pos, 1, this.labelPadding, this.verticalLayout, () => { });
      bucket.createTick(pos, 1, this.verticalLayout);

      this.providers.labels.add(bucket.mainLabel);
      this.providers.ticks.add(bucket.tick);
    }
  }
}
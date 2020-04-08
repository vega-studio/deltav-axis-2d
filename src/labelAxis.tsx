import { Vec2, Vec3 } from "./types";
import { LabelAxisStore, ILabelAxisStoreOptions } from "./store/label-axis-store";

export interface ILabelAxisProps extends ILabelAxisStoreOptions<string> { }

export class LabelAxis {
  store: LabelAxisStore<string>;

  constructor(props: ILabelAxisProps) {
    this.store = new LabelAxisStore({
      view: props.view,
      childrenNumber: props.childrenNumber,
      providers: props.providers,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,
      labels: props.labels,
      maxLabelLength: props.maxLabelLength,
      verticalLayout: props.verticalLayout,
      displayRangeLabels: props.displayRangeLabels,
      onDisplayRange: props.onDisplayRange,
      onMainLabelInstance: props.onMainLabelInstance,
      onSubLabelInstance: props.onSubLabelInstance,
      onTickInstance: props.onTickInstance
    });
  }

  /**
   * Shifts the axis by a given amount
   */
  shift(offset: Vec3) {
    this.store.updateOffset(offset);
  }

  zoom(focus: Vec2, deltaScale: Vec3) {
    this.store.updateScale(focus, deltaScale);
  }
}
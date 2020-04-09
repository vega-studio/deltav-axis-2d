import { Vec2, Vec3 } from "./types";
import { LabelAxisStore, ILabelAxisStoreOptions } from "./store/label-axis-store";

export interface ILabelAxisProps extends ILabelAxisStoreOptions<string> { }

export class LabelAxis {
  store: LabelAxisStore<string>;

  constructor(props: ILabelAxisProps) {
    this.store = new LabelAxisStore({
      childrenNumber: props.childrenNumber,
      displayRangeLabels: props.displayRangeLabels,
      labelColor: props.labelColor,
      labelFontSize: props.labelFontSize,
      labelPadding: props.labelPadding,
      labels: props.labels,
      maxLabelLength: props.maxLabelLength,
      providers: props.providers,
      tickColor: props.tickColor,
      tickLength: props.tickLength,
      tickWidth: props.tickWidth,
      verticalLayout: props.verticalLayout,
      view: props.view,
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
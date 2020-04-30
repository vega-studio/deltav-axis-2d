import { Vec2, Vec3 } from "./types";
import { INumberAxisStoreOptions, NumberAxisStore } from "./store/number-axis-store";
import { RangeNumberAxisStore } from "./store/range-number-axis-store";

export interface INumberAxisProps extends INumberAxisStoreOptions<number> { }

export class NumberAxis {
  store: RangeNumberAxisStore<number>;

  constructor(props: INumberAxisProps) {
    this.store = new RangeNumberAxisStore({
      bucketWidth: props.bucketWidth,
      childrenNumber: props.childrenNumber,
      decimalLength: props.decimalLength,
      displayRangeLabels: props.displayRangeLabels,
      labelColor: props.labelColor,
      labelFontSize: props.labelFontSize,
      labelPadding: props.labelPadding,
      numberGap: props.numberGap,
      numberRange: props.numberRange,
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
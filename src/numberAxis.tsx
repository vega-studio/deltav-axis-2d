import { Vec2, Vec3 } from "./types";
import { INumberAxisStoreOptions, NumberAxisStore } from "./store/number-axis-store";

export interface INumberAxisProps extends INumberAxisStoreOptions<number> { }

export class NumberAxis {
  store: NumberAxisStore<number>;

  constructor(props: INumberAxisProps) {
    this.store = new NumberAxisStore({
      childrenNumber: props.childrenNumber,
      view: props.view,
      providers: props.providers,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,
      numberRange: props.numberRange,
      numberGap: props.numberGap,
      decimalLength: props.decimalLength,
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
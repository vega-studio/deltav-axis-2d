import { AxisStore, IAxisStoreOptions } from "./store";
import { Vec2, Vec3 } from "./types";

export interface IAxisProps extends IAxisStoreOptions { }

export class Axis {
  store: AxisStore;

  constructor(props: IAxisProps) {
    this.store = new AxisStore({
      view: props.view,
      providers: props.providers,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,
      type: props.type,
      labels: props.labels,
      startDate: props.startDate,
      endDate: props.endDate,
      maxLabelLength: props.maxLabelLength,
      numberRange: props.numberRange,
      numberGap: props.numberGap
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
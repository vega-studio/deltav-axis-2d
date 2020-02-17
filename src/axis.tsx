import { AxisStore, IAxisStoreOptions } from "./store";
import { AxisDataType, Color, Vec2, Vec3 } from "./types";

export interface IAxisProps extends IAxisStoreOptions {

}

export class Axis {
  store: AxisStore;

  constructor(props: IAxisProps) {
    this.store = new AxisStore({
      padding: {
        left: props.padding.left,
        right: props.padding.right,
        top: props.padding.top,
        bottom: props.padding.bottom
      },
      providers: props.providers,
      width: window.innerWidth, // need to change
      height: window.innerHeight,
      lineWidth: props.lineWidth,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,

      type: props.type,
      labels: props.labels,
      startDate: props.startDate,
      endDate: props.endDate,
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
import { Vec2, Vec3 } from "./types";
import { DateAxisStore, IDateAxisStoreOptions } from "./store/date-axis-store";

export interface IDateAxisProps extends IDateAxisStoreOptions<Date> { }

export class DateAxis {
  store: DateAxisStore<Date>;

  constructor(props: IDateAxisProps) {
    this.store = new DateAxisStore({
      view: props.view,
      providers: props.providers,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,
      startDate: props.startDate,
      endDate: props.endDate,
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
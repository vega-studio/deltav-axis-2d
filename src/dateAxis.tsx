import { Vec2, Vec3 } from "./types";
import { DateAxisStore, IDateAxisStoreOptions } from "./store/date-axis-store";

export interface IDateAxisProps extends IDateAxisStoreOptions<Date> { }

export class DateAxis {
  store: DateAxisStore<Date>;

  constructor(props: IDateAxisProps) {
    this.store = new DateAxisStore({
      bucketWidth: props.bucketWidth,
      startDate: props.startDate,
      endDate: props.endDate,
      displayRangeLabels: props.displayRangeLabels,
      labelColor: props.labelColor,
      labelFontSize: props.labelFontSize,
      labelPadding: props.labelPadding,
      providers: props.providers,
      tickColor: props.tickColor,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
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
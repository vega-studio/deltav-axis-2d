import { Vec2, Vec3 } from "./types";
import { DateAxisStore, IDateAxisStoreOptions } from "./store/date-axis-store";
export interface IDateAxisProps extends IDateAxisStoreOptions<Date> {
}
export declare class DateAxis {
    store: DateAxisStore<Date>;
    constructor(props: IDateAxisProps);
    /**
     * Shifts the axis by a given amount
     */
    shift(offset: Vec3): void;
    zoom(focus: Vec2, deltaScale: Vec3): void;
}

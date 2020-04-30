import { Vec2, Vec3 } from "./types";
import { INumberAxisStoreOptions } from "./store/number-axis-store";
import { RangeNumberAxisStore } from "./store/range-number-axis-store";
export interface INumberAxisProps extends INumberAxisStoreOptions<number> {
}
export declare class NumberAxis {
    store: RangeNumberAxisStore<number>;
    constructor(props: INumberAxisProps);
    /**
     * Shifts the axis by a given amount
     */
    shift(offset: Vec3): void;
    zoom(focus: Vec2, deltaScale: Vec3): void;
}

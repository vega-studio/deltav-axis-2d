import { Vec2, Vec3 } from "./types";
import { INumberAxisStoreOptions, NumberAxisStore } from "./store/number-axis-store";
export interface INumberAxisProps extends INumberAxisStoreOptions<number> {
}
export declare class NumberAxis {
    store: NumberAxisStore<number>;
    constructor(props: INumberAxisProps);
    /**
     * Shifts the axis by a given amount
     */
    shift(offset: Vec3): void;
    zoom(focus: Vec2, deltaScale: Vec3): void;
}

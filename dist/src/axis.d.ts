import { AxisStore, IAxisStoreOptions } from "./store";
import { Vec2, Vec3 } from "./types";
export interface IAxisProps extends IAxisStoreOptions {
}
export declare class Axis {
    store: AxisStore;
    constructor(props: IAxisProps);
    /**
     * Shifts the axis by a given amount
     */
    shift(offset: Vec3): void;
    zoom(focus: Vec2, deltaScale: Vec3): void;
}

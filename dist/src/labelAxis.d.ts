import { Vec2, Vec3 } from "./types";
import { LabelAxisStore, ILabelAxisStoreOptions } from "./store/label-axis-store";
export interface ILabelAxisProps extends ILabelAxisStoreOptions<string> {
}
export declare class LabelAxis {
    store: LabelAxisStore<string>;
    constructor(props: ILabelAxisProps);
    /**
     * Shifts the axis by a given amount
     */
    shift(offset: Vec3): void;
    zoom(focus: Vec2, deltaScale: Vec3): void;
}

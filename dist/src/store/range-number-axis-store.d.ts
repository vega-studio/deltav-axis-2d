import { NumberAxisStore, INumberAxisStoreOptions } from "./number-axis-store";
import { Vec2 } from "deltav";
import { Bucket } from "./bucket";
export declare class RangeNumberAxisStore<T extends number> extends NumberAxisStore<number> {
    bucketLevelMap: Map<number, Map<number, Bucket>>;
    initIndexRange(options: INumberAxisStoreOptions<T>): void;
    getMaxLevel(): number;
    layoutBuckets(): void;
    setBucket(level: number, index: number, position: Vec2, alpha: number): void;
    updateIndexRange(): void;
    removeBuckets(start: number, end: number): void;
}

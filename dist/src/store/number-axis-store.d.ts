import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import { Vec2 } from "deltav";
export interface INumberAxisStoreOptions<T extends number> extends IBasicAxisStoreOptions<number> {
    /** Sets the number range to show in the axis */
    numberRange: Vec2;
    /** Sets the difference between every number in the axis */
    numberGap?: number;
    /** Sets the max length of decimal if a number is a float number */
    decimalLength?: number;
    /** Sets the number of children buckets in each bucket to fade in when zoom in */
    childrenNumber?: number;
}
export declare class NumberAxisStore<T extends number> extends BasicAxisStore<number> {
    private numberRange;
    private numberGap;
    private childrenNumber;
    private decimalLength;
    constructor(options: INumberAxisStoreOptions<T>);
    initIndexRange(options: INumberAxisStoreOptions<T>): void;
    getPreSetWidth(): number;
    getPreSetHeight(): number;
    getMainLabel(index: number): string;
    getSubLabel(): string;
    getAlphas(): {
        labelAlpha: number;
        tickAlpha: number;
    };
    getMaxLevel(): number;
    generateIntervalLengths(): void;
    getIndexLevel(index: number): number;
    getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number): number[];
    posToDomain(pos: number): number;
    /** Reset the display range to [start, end] */
    setRange(start: number, end: number): void;
    setAtlasLabel(): Promise<void>;
}

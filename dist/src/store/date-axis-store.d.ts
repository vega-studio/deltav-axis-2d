import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import { Vec2 } from "deltav";
export interface IDateAxisStoreOptions<T extends Date> extends IBasicAxisStoreOptions<T> {
    /** Sets the start date to show in the axis */
    startDate?: Date | string;
    /** Sets the end date to show in the axis */
    endDate?: Date | string;
}
export declare class DateAxisStore<T extends Date> extends BasicAxisStore<Date> {
    private startDate;
    private endDate;
    private totalYears;
    constructor(options: IDateAxisStoreOptions<T>);
    getMainLabel(index: number): string;
    getSubLabel(index: number): string;
    getPreSetWidth(): number;
    getPreSetHeight(): number;
    generateIntervalLengths(): void;
    initIndexRange(options: IDateAxisStoreOptions<Date>): void;
    getMaxLevel(): number;
    getAlphas(): {
        labelAlpha: number;
        tickAlpha: number;
    };
    getIndexLevel(index: number): number;
    getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number): number[];
    posToDomain(pos: number): Date;
    setLabel(index: number, position: Vec2, alpha: number): void;
    /** Reset the display date range to [startDate, endDate] */
    setRange(startDate: string | Date, endDate: string | Date): void;
    setAtlasLabel(): Promise<unknown>;
    updateInterval(): void;
}

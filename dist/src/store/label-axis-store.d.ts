import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
export interface ILabelAxisStoreOptions<T extends string> extends IBasicAxisStoreOptions<T> {
    /** Sets the labels to show for the axis */
    labels: string[];
    /** Sets the max amount of letters in a label */
    maxLabelLength?: number;
    /** Sets the number of children buckets in each bucket to fade in when zoom in */
    childrenNumber?: number;
}
export declare class LabelAxisStore<T extends string> extends BasicAxisStore<string> {
    private labels;
    private maxLabelLength;
    private childrenNumber;
    constructor(options: ILabelAxisStoreOptions<T>);
    initIndexRange(options: ILabelAxisStoreOptions<T>): void;
    getPreSetWidth(): number;
    getPreSetHeight(): number;
    getMainLabel(index: number): string;
    getSubLabel(): string;
    generateIntervalLengths(): void;
    getIndexLevel(index: number): number;
    getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number): number[];
    getAlphas(): {
        labelAlpha: number;
        tickAlpha: number;
    };
    getMaxLevel(): number;
    posToDomain(pos: number): string;
    setAtlasLabel(): Promise<void>;
}

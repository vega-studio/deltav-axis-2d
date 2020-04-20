import { EdgeInstance, LabelInstance, Vec2, Vec4 } from "deltav";
export interface IBucketOptions {
    /** Sets the color of labels in the bucket */
    labelColor?: Vec4;
    /** Sets the fontSize of labels in the bucket */
    labelFontSize?: number;
    /** Sets the color of the tick in the bucket */
    tickColor: Vec4;
    /** Sets the length of thie tick in the bucket */
    tickLength?: number;
    /** Sets the thickness of tick in the bucket  */
    tickWidth?: number;
    /** Callback for the main labelInstance */
    onMainLabelInstance: (instance: LabelInstance) => void;
    /** Callback for the sub labelInstance */
    onSubLabelInstance: (instance: LabelInstance) => void;
    /** Callback for the tickInstance */
    onTickInstance: (instance: EdgeInstance) => void;
}
export declare class Bucket {
    showLabels: boolean;
    showTick: boolean;
    tick: EdgeInstance;
    mainLabel: LabelInstance;
    subLabel: LabelInstance;
    private labelColor;
    private labelFontSize;
    private tickColor;
    private tickLength;
    private tickWidth;
    onTickInstance: (instance: EdgeInstance) => void;
    onMainLabelInstance: (instance: LabelInstance) => void;
    onSubLabelInstance: (instance: LabelInstance) => void;
    constructor(options: IBucketOptions);
    createMainLabel(text: string, position: Vec2, alpha: number, padding: number, verticalLayout: boolean, onLabelReady?: (instance: LabelInstance) => void): void;
    createSubLabel(text: string, position: Vec2, alpha: number, padding: number, verticalLayout: boolean): void;
    createTick(position: Vec2, alpha: number, verticalLayout: boolean): void;
    updateMainLabel(position: Vec2, alpha: number, padding: number, verticalLayout: boolean): void;
    updateSubLabel(position: Vec2, alpha: number, padding: number, verticalLayout: boolean): void;
    updateTick(position: Vec2, alpha: number, verticalLayout: boolean): void;
}

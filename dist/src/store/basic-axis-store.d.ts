import { Color, Vec2, InstanceProvider, EdgeInstance, LabelInstance, Vec3 } from "deltav";
import { Bucket } from "./bucket";
import { HorizonRangeLayout, VerticalRangeLayout } from "src/types";
export interface IBasicAxisStoreOptions<T extends number | string | Date> {
    bucketWidth: number;
    /** Sets whether the axis displays range labels */
    displayRangeLabels?: boolean;
    /** Sets the color of labels */
    labelColor?: Color;
    /** Sets the fontsize of labels */
    labelFontSize?: number;
    /** Sets the padding value of labels */
    labelPadding?: number;
    /** Sets the provides for ticks and labels */
    providers?: {
        ticks?: InstanceProvider<EdgeInstance>;
        labels?: InstanceProvider<LabelInstance>;
    };
    /** Indicates whether the axis resize with window size changing  */
    resizeWithWindow?: boolean;
    /** Sets the color of ticks */
    tickColor?: Color;
    /** Sets the length of ticks */
    tickLength?: number;
    /** Sets the thickness of the ticks */
    tickWidth?: number;
    /** Indicates the side of range labels in horizon mode. Can be ABOVE or BELOW*/
    horizonRangeLayout?: HorizonRangeLayout;
    /** Indicates the side of range labels in vertical mode. Can be LEFT or RIGHT*/
    verticalRangeLayout?: VerticalRangeLayout;
    /** Indicates whether the axis layouts in vertical direction */
    verticalLayout?: boolean;
    /** Sets the origin and size([width, height]) of the axis*/
    view: {
        origin: Vec2;
        size: Vec2;
    };
    /** Callback to set range labels */
    onDisplayRange?: (displayRange: [T, T]) => [string, string];
    /** Callback when the tickInstances are ready */
    onTickInstance?: (instance: EdgeInstance) => void;
    /** Callback when the main labelInstances are ready */
    onMainLabelInstance?: (instance: LabelInstance) => void;
    /** Callback when the sub labelInstances are ready */
    onSubLabelInstance?: (instance: LabelInstance) => void;
}
export declare abstract class BasicAxisStore<T extends number | string | Date> {
    protected verticalLayout: boolean;
    private resizeWithWindow;
    private displayRangeLabels;
    private horizonRangeLayout;
    private verticalRangeLayout;
    protected view: {
        origin: Vec2;
        size: Vec2;
    };
    private windowWidth;
    private windowHeight;
    protected tickWidth: number;
    protected tickLength: number;
    protected tickColor: Color;
    protected labelFontSize: number;
    protected labelColor: Color;
    protected labelPadding: number;
    protected maxLabelWidth: number;
    protected maxLabelHeight: number;
    protected preSetMaxWidth: number;
    protected preSetMaxHeight: number;
    protected tickScaleLevel: number;
    protected labelScaleLevel: number;
    protected preTickScaleLevel: number;
    protected preLabelScaleLevel: number;
    protected intervalLengths: number[];
    protected maxRange: Vec2;
    protected viewRange: Vec2;
    protected indexRange: Vec2;
    protected unitNumber: number;
    protected unitWidth: number;
    protected unitHeight: number;
    protected offset: number;
    private scale;
    protected bucketMap: Map<number, Bucket>;
    private auxLines;
    private headLabel;
    private tailLabel;
    protected interval: number;
    protected lowerInterval: number;
    providers: {
        ticks: InstanceProvider<EdgeInstance>;
        labels: InstanceProvider<LabelInstance>;
    };
    mainLabelHandler: (_label: LabelInstance) => void;
    subLabelHandler: (_label: LabelInstance) => void;
    tickHandler: (_tick: EdgeInstance) => void;
    rangeHandler: (values: [T, T]) => string[];
    labelReady: (text: string) => Promise<unknown>;
    constructor(options: IBasicAxisStoreOptions<T>);
    /** Pre set a hidden string to get glyph info */
    abstract setAtlasLabel(): Promise<any>;
    /** Set the mainlabel text format */
    abstract getMainLabel(index: number, level?: number): string;
    /** Sets the subLabel text format */
    abstract getSubLabel(index: number): string;
    /** Sets the preSetWidth for layout and updateInterval*/
    abstract getPreSetWidth(): number;
    /** Sets the preSetHeight for layout and updateInterval*/
    abstract getPreSetHeight(): number;
    /**  Returns which level an index is at*/
    abstract getIndexLevel(index: number): number;
    /** Returns indices from index start to index end between lowerLevel and higherLevel (inclusive) */
    abstract getIndices(start: number, end: number, lowerLevel: number, higherLevel: number): number[];
    /** Gets labelAlpha and tickAlpha of buckets at current labelLevel */
    abstract getAlphas(): {
        labelAlpha: number;
        tickAlpha: number;
    };
    /** Get max level of an axis */
    abstract getMaxLevel(): number;
    /** Generate interveal lengths at each level */
    abstract generateIntervalLengths(): void;
    /** Inits metrics specific in different axis type */
    abstract initIndexRange(options: IBasicAxisStoreOptions<T>): void;
    /** Return the current value of a bucket at position pos */
    abstract posToDomain(pos: number): T;
    /** Toggle layout mode between horizon and vertical mode */
    changeAxis(): void;
    /** Draw auxilary lines to indicate the bound of axis */
    drawAuxilaryLines(): void;
    /** Sets the labels at both ends to indicate the current range */
    getRangeLabels(): Promise<void>;
    init(): Promise<void>;
    /** Sets chart metrics */
    initChartMetrics(): void;
    /** Layout buckets at current levels */
    layoutBuckets(): void;
    /** Layout buckets and get range labels */
    layout(): void;
    /** Callback when label is ready */
    onLabelReady: (label: LabelInstance) => void;
    removeAll(): void;
    /** Resize the chart */
    resize(): void;
    /** Remove buckets between index from start to end (inclusive) */
    removeBuckets(start: number, end: number): void;
    /** Remove buckets which has a lowerLevel than the currentLevel */
    removeBucketsAtLowerLevels(start: number, end: number): void;
    /** Remove labels from index start to end between two levels */
    removeLabels(start: number, end: number, lowerLevel: number, higherLevel?: number): void;
    /** Remove ticks from index start to end between two levels */
    removeTicks(start: number, end: number, lowerLevel: number, higherLevel?: number): void;
    /** Set a new view */
    setView(view: {
        origin: Vec2;
        size: Vec2;
    }): void;
    /** Set tick's position and alpha at index, update or create a new one */
    setTick(index: number, position: Vec2, alpha: number): void;
    /** Set label's position and alpha at index, update or create a new one */
    setLabel(index: number, position: Vec2, alpha: number): void;
    /** Transform scale from this.scale */
    transformScale(): number;
    /** Update current index range */
    updateIndexRange(): void;
    /** Update the max range of chart */
    updateMaxRange(low: number, high: number, length: number): void;
    /** Update offset when panning the axis */
    updateOffset(offset: Vec3): void;
    /** Update scale when zooming the axis */
    updateScale(mouse: Vec2, scale: Vec3): void;
    /** Update the current interval to be just bigger than the max value */
    updateInterval(): void;
}

import { Color, InstanceProvider, EdgeInstance, LabelInstance, Vec2 } from "deltav";
export interface IFixedLabelAxisStoreOptions {
    /** Sets the labels to show for the axis */
    labels: string[];
    /** Sets the max amount of letters in a label */
    maxLabelLength?: number;
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
    /** Sets the color of ticks */
    tickColor?: Color;
    /** Sets the length of ticks */
    tickLength?: number;
    /** Sets the thickness of the ticks */
    tickWidth?: number;
    /** Indicates whether the axis layouts in vertical direction */
    verticalLayout?: boolean;
    /** Sets the origin and size([width, height]) of the axis*/
    view: {
        origin: Vec2;
        size: Vec2;
    };
    /** Callback when the tickInstances are ready */
    onTickInstance?: (instance: EdgeInstance) => void;
    /** Callback when the main labelInstances are ready */
    onLabelInstance?: (instance: LabelInstance) => void;
}
export declare class FixedLabelAxis {
    private labels;
    private maxLabelLength;
    protected tickWidth: number;
    protected tickLength: number;
    protected tickColor: Color;
    protected labelFontSize: number;
    protected labelColor: Color;
    protected labelPadding: number;
    protected unitNumber: number;
    protected unitWidth: number;
    protected unitHeight: number;
    protected verticalLayout: boolean;
    protected view: {
        origin: Vec2;
        size: Vec2;
    };
    providers: {
        ticks: InstanceProvider<EdgeInstance>;
        labels: InstanceProvider<LabelInstance>;
    };
    labelHandler: (_label: LabelInstance) => void;
    tickHandler: (_tick: EdgeInstance) => void;
    constructor(options: IFixedLabelAxisStoreOptions);
    layout(): void;
}

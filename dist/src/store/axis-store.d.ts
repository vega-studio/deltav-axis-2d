import { InstanceProvider, EdgeInstance, LabelInstance, Color } from "deltav";
import { AxisDataType, Vec2, Vec3 } from "src/types";
import { dateLevel } from "src/util/dateUtil";
export interface IAxisStoreOptions {
    view: {
        origin: Vec2;
        size: Vec2;
    };
    providers?: {
        ticks?: InstanceProvider<EdgeInstance>;
        labels?: InstanceProvider<LabelInstance>;
    };
    labelColor?: Color;
    labelSize?: number;
    labelHighlightColor?: Color;
    labelPadding?: number;
    tickWidth?: number;
    tickLength?: number;
    type: AxisDataType;
    labels?: string[];
    startDate?: Date | string;
    endDate?: Date | string;
    numberRange?: Vec2;
    numberGap?: number;
}
export declare class AxisStore {
    verticalLayout: boolean;
    axisChanged: boolean;
    type: AxisDataType;
    labelInstances: LabelInstance[];
    tickLineInstances: EdgeInstance[];
    view: {
        origin: Vec2;
        size: Vec2;
    };
    tickWidth: number;
    tickLength: number;
    labelSize: number;
    labelColor: Color;
    labelPadding: number;
    maxLabelWidth: number;
    maxLabelHeight: number;
    maxLabelLengh: number;
    labels: string[];
    dates: dateLevel[];
    maxRange: Vec2;
    viewRange: Vec2;
    offset: number;
    scale: number;
    interval: number;
    dateIntervalLengths: number[];
    providers: {
        ticks: InstanceProvider<EdgeInstance>;
        labels: InstanceProvider<LabelInstance>;
    };
    constructor(options: IAxisStoreOptions);
    init(): void;
    generateLabelTexts(options: IAxisStoreOptions): string[];
    generateDateLabels(startDate: string | Date, endDate: string | Date): string[];
    generateNumberLabels(numberRange: Vec2, numberGap?: number): string[];
    changeAxis(): void;
    layoutLabels(): void;
    updateChartMetrics(): void;
    updateScale(mouse: Vec2, scale: Vec3): void;
    updateOffset(offset: Vec3): void;
    updateMaxRange(left: number, right: number, width: number): void;
}

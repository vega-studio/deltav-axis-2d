import { InstanceProvider, EdgeInstance, LabelInstance, Color } from "deltav";
import { AxisDataType, Vec2, Vec3 } from "src/types";
import { dateLevel } from "src/util/dateUtil";
export interface IAxisStoreOptions {
    padding: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    providers?: {
        ticks?: InstanceProvider<EdgeInstance>;
        labels?: InstanceProvider<LabelInstance>;
    };
    width?: number;
    height?: number;
    labelColor?: Color;
    labelSize?: number;
    labelHighlightColor?: Color;
    labelPadding?: number;
    lineWidth?: number;
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
    type: AxisDataType;
    labelInstances: LabelInstance[];
    tickLineInstances: EdgeInstance[];
    width: number;
    height: number;
    axisWidth: number;
    axisHeight: number;
    origin: Vec2;
    lineWidth: number;
    tickWidth: number;
    tickLength: number;
    padding: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
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
    providers: {
        ticks: InstanceProvider<EdgeInstance>;
        labels: InstanceProvider<LabelInstance>;
    };
    constructor(options: IAxisStoreOptions);
    init(): void;
    generateLabelTexts(options: IAxisStoreOptions): string[];
    dateIntevalLengths: number[];
    generateDateLabels(startDate: string | Date, endDate: string | Date): string[];
    generateNumberLabels(numberRange: Vec2, numberGap?: number): string[];
    interval: number;
    layoutLabels(): void;
    updateChartMetrics(): void;
    updateScale(mouse: Vec2, scale: Vec3): void;
    updateOffset(offset: Vec3): void;
    updateMaxRange(left: number, right: number, width: number): void;
}

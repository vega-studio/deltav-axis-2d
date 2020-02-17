export declare type dateLevel = {
    year: number;
    month: number;
    day: number;
    level: number;
};
export declare function travelDates(start: Date, end: Date, labels: dateLevel[]): void;
export declare function getLength(start: Date, end: Date): number;
export declare function getIntervalLengths(start: Date, end: Date): number[];

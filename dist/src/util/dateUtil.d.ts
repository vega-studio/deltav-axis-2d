export declare type dateLevel = {
    year: number;
    month: number;
    day: number;
    level: number;
};
export declare function getIndices(origin: Date, startDate: Date, endDate: Date, totalYears: number, lowerLevel: number, higherLevel: number): number[];
export declare function getIndicesAtLevel(origin: Date, startDate: Date, endDate: Date, totalYears: number, level: number, indices: number[]): number[];
export declare function getMaxLevel(startDate: Date, endDate: Date): number;
export declare function getDayLevel(origin: Date, day: Date, totalYears: number): number;
export declare function getMomentLevel(origin: Date, moment: Date, totalYears: number): number;
export declare function travelDates(start: Date, end: Date, labels: dateLevel[]): void;
export declare function getLength(start: Date, end: Date): number;
export declare function getIntervalLengths(start: Date, end: Date): number[];
export declare function getSimpleIntervalLengths(start: Date, end: Date): number[];
export declare function getSimpleMomentLevel(origin: Date, moment: Date, totalYears: number): number;
export declare function getSimpleIndices(origin: Date, totalYears: number, startDate: Date, endDate: Date, lowerLevel: number, higherLevel: number): number[];

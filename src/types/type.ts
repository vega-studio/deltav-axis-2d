import { LabelInstance, EdgeInstance } from "deltav";

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Color = [number, number, number, number];

export type Bucket = {
  displayLabel: boolean;
  displayTick: boolean;
  tick?: EdgeInstance;
  label1?: LabelInstance;
  label2?: LabelInstance;
  label3?: LabelInstance;
}
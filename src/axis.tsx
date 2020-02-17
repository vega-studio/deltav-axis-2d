import React, { Component } from "react";
import { AxisStore } from "./store";
import { AxisAction } from "./action";
import { Color } from "deltav";
import { AxisView } from "./view";
import * as dat from "dat.gui";
import { AxisDataType } from "./types";

export interface IAxisProps {
  type: AxisDataType;

  labels?: string[];

  startDate?: Date | string;
  endDate?: Date | string

  numberRange?: [number, number];
  numberGap?: number;

  labelFont?: string;
  labelColor?: Color;
  labelSize?: number;
  labelHighlightColor?: Color;
  labelPadding?: number;
  lineColor?: Color;
  lineWidth?: number;
  tickWidth?: number;
  tickLength?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Axis extends Component<IAxisProps> {
  store: AxisStore;
  action: AxisAction;
  font: string;

  parameters = {
    toggleLayout: () => {
      this.store.changeAxis();
    }
  }

  constructor(props: IAxisProps) {
    super(props);
    this.action = new AxisAction();
    this.store = new AxisStore({
      origin: [props.x, props.y],
      width: props.width,
      height: props.height,
      lineWidth: props.lineWidth,
      tickWidth: props.tickWidth,
      tickLength: props.tickLength,
      labelSize: props.labelSize,
      labelColor: props.labelColor,
      labelPadding: props.labelPadding,

      type: props.type,
      labels: props.labels,
      startDate: props.startDate,
      endDate: props.endDate,
      numberRange: props.numberRange,
      numberGap: props.numberGap
    });
    this.font = props.labelFont;
    this.buildConsole();
    // this.action.store = this.store;
  }

  buildConsole() {
    const ui = new dat.GUI();
    ui.add(this.parameters, 'toggleLayout');
  }

  render() {
    return <AxisView store={this.store} action={this.action} font={this.font} />;
  }
}
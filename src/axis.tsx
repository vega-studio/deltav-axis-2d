import React, { Component } from "react";
import { AxisStore } from "./store";
import { AxisAction } from "./action";
import { Color } from "deltav";
import { AxisView } from "./view";

export interface IAxisProps {
  labels: string[];
  labelFont?: string;
  labelColor?: Color;
  labelHighlightColor?: Color;
  lineColor?: Color;
  lineWidth?: number;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }
}

export class Axis extends Component<IAxisProps> {
  store: AxisStore;
  action: AxisAction;

  constructor(props: IAxisProps) {
    super(props);
    this.action = new AxisAction();
    this.store = new AxisStore({
      padding: {
        left: props.padding.left,
        right: props.padding.right,
        top: props.padding.top,
        bottom: props.padding.bottom
      },
      width: window.innerWidth, // need to change
      height: window.innerHeight,
      lineWidth: props.lineWidth
    });

    // this.action.store = this.store;
  }

  render() {
    return <AxisView store={this.store} action={this.action} />;
  }
}
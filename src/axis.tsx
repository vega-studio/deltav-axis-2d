import React, { Component } from "react";
import { AxisStore } from "./store";
import { AxisAction } from "./action";
import { Color } from "deltav";
import { AxisView } from "./view";
import * as dat from "dat.gui";

export interface IAxisProps {
  labels: string[];
  labelFont?: string;
  labelColor?: Color;
  labelSize?: number;
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
  font: string;

  parameters = {
    toggleLayout: () => {
      this.store.verticalLayout = !this.store.verticalLayout;
      this.store.updateChartMetrics();
      this.store.layoutLines();
      this.store.layoutLabels();
    }
  }

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
      lineWidth: props.lineWidth,
      labels: props.labels,
      labelSize: props.labelSize,
      labelColor: props.labelColor
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
import React, { Component } from "react";
import {
  BasicSurface,
  Camera2D,
  BasicCamera2DController,
  createView,
  View2D,
  ClearFlags,
  createLayer,
  EdgeLayer,
  EdgeType,
  LabelLayer,
  IPickInfo,
  PickType,
  AutoEasingMethod,
  RectangleLayer,
  EdgeInstance,
} from "deltav";
import { AxisAction } from "src/action";
import { AxisStore } from "src/store";
import { DEFAULT_RESOURCES } from "src/types";

export interface IAxisViewProps {
  action: AxisAction;
  store: AxisStore;
}

export class AxisView extends Component<IAxisViewProps> {
  action: AxisAction;
  store: AxisStore;

  constructor(props: IAxisViewProps) {
    super(props);
    this.action = props.action;
    this.store = props.store;
  }

  componentDidMount() {
    const container: React.ReactInstance = this.refs.container;
    this.makeSurface(container as HTMLElement);
  }

  componentWillUnmount() {

  }

  async makeSurface(container: HTMLElement) {
    const surface = new BasicSurface({
      container,
      providers: this.store.providers,
      cameras: {
        main: new Camera2D(),
        axis: new Camera2D()
      },
      resources: {
        font: DEFAULT_RESOURCES.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main,
          panFilter: (offset: [number, number, number]) => {
            return [0, 0, 0];
          },
          scaleFilter: (scale: [number, number, number]) => {
            return [0, 0, 0];
          }
        }),
      }),
      scenes: (resources, providers, cameras) => ({
        resources: [],
        scenes: {
          main: {
            views: {
              start: createView(View2D, {
                camera: cameras.main,
                background: [0, 0, 0, 1],
                clearFlags: [ClearFlags.COLOR, ClearFlags.DEPTH]
              })
            },
            layers: [
              createLayer(EdgeLayer, {
                animate: {
                  startColor: AutoEasingMethod.easeInOutCubic(300),
                  endColor: AutoEasingMethod.easeInOutCubic(300),
                  start: AutoEasingMethod.easeInOutCubic(300),
                  end: AutoEasingMethod.easeInOutCubic(300),
                  thickness: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.lines,
                key: `recLines`,
                type: EdgeType.LINE,
              })
            ]
          }
        }
      })
    });

    await surface.ready;
    return surface;
  }

  render() {
    return <div
      ref='container'
      style={{ width: '100%', height: '100%' }}
    ></div>;
  }
}
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
  SimpleEventHandler,
  IMouseInteraction,
  IFontResourceOptions,
  createFont,
  FontMapGlyphType,
  TextureSize,
} from "deltav";
import { AxisAction } from "src/action";
import { AxisStore } from "src/store";
import { DEFAULT_RESOURCES } from "src/types";

export interface IAxisViewProps {
  action: AxisAction;
  store: AxisStore;
  font?: string;
}

export class AxisView extends Component<IAxisViewProps> {
  action: AxisAction;
  store: AxisStore;
  mouse: [number, number] = [0, 0];
  font: IFontResourceOptions;

  constructor(props: IAxisViewProps) {
    super(props);
    this.action = props.action;
    this.store = props.store;

    if (props.font) {
      this.font = createFont({
        dynamic: true,
        fontSource: {
          localKerningCache: false,
          size: 64,
          family: props.font,
          type: FontMapGlyphType.BITMAP,
          weight: "normal"
        },
        fontMapSize: [TextureSize._2048, TextureSize._2048]
      })
    } else {
      this.font = DEFAULT_RESOURCES.font;
    }
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
        font: this.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main,
          panFilter: (offset: [number, number, number]) => {
            this.store.updateOffset(offset);
            return [0, 0, 0];
          },
          scaleFilter: (scale: [number, number, number]) => {
            //console.warn("scale", view);
            this.store.updateScale(this.mouse, scale)
            return [0, 0, 0];
          },

        }),
        simple: new SimpleEventHandler({
          handleMouseMove: (e: IMouseInteraction) => {
            this.mouse = e.mouse.currentPosition;
          }
        })
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
                  //start: AutoEasingMethod.easeInOutCubic(300),
                  //end: AutoEasingMethod.easeInOutCubic(300),
                  thickness: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.lines,
                key: `lines`,
                type: EdgeType.LINE,
              }),
              createLayer(LabelLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300),
                  //origin: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.labels,
                key: `labels `,
                resourceKey: resources.font.key
              })
            ]
          },
          axis: {
            views: {
              start: createView(View2D, {
                camera: cameras.axis,
                background: [0, 0, 0, 1],
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
                data: providers.axis,
                key: `axis`,
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
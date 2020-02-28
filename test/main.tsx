import { Axis } from "src";
import { travelDates, getLength, getIntervalLengths, dateLevel } from "src/util/dateUtil";
import { AxisDataType } from "src/types";
import { AutoEasingMethod, createLayer, createView, View2D, EdgeLayer, LabelLayer, ClearFlags, SimpleEventHandler, IMouseInteraction, BasicSurface, Camera2D, BasicCamera2DController, EdgeType, Vec2, InstanceProvider, EdgeInstance, LabelInstance, createFont, FontMapGlyphType } from "deltav";
import * as dat from "dat.gui";

let axis1: Axis;
let axis2: Axis;
let axis3: Axis;

const parameters = {
  toggleLayout: () => {
    axis1.store.changeAxis();
    axis2.store.changeAxis();
    axis3.store.changeAxis();
  }
}

function buildConsole() {
  const ui = new dat.GUI();
  ui.add(parameters, 'toggleLayout');
}

async function makeSurface(container: HTMLElement) {
  let mouse: Vec2 = [0, 0];

  const surface = new BasicSurface({
    container,
    providers: {
      ticks: new InstanceProvider<EdgeInstance>(),
      labels: new InstanceProvider<LabelInstance>(),
    },
    cameras: {
      main: new Camera2D(),
      axis: new Camera2D()
    },
    resources: {
      font: createFont({
        dynamic: true,
        fontSource: {
          errorGlyph: ' ',
          family: 'Verdana',
          size: 64,
          weight: 400,
          localKerningCache: false,
          type: FontMapGlyphType.BITMAP
        }
      })
    },
    eventManagers: cameras => ({
      controller: new BasicCamera2DController({
        camera: cameras.main,
        panFilter: (offset: [number, number, number]) => {
          axis1.shift(offset);
          axis2.shift(offset);
          axis3.shift(offset);
          return [0, 0, 0];
        },
        scaleFilter: (scale: [number, number, number]) => {
          axis1.zoom(mouse, scale);
          axis2.zoom(mouse, scale)
          axis3.zoom(mouse, scale)
          return [0, 0, 0];
        },
      }),
      simple: new SimpleEventHandler({
        handleMouseMove: (e: IMouseInteraction) => {
          mouse = e.mouse.currentPosition;
        }
      })
    }),
    scenes: (resources, providers, cameras) => ({
      main: {
        views: {
          start: createView(View2D, {
            camera: cameras.main,
            background: [0, 0, 0, 1],
            clearFlags: [ClearFlags.COLOR, ClearFlags.DEPTH]
          })
        },
        layers: {
          ticks: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks,
            type: EdgeType.LINE,
          }),
          labels: createLayer(LabelLayer, {
            animate: {
              // color: AutoEasingMethod.easeInOutCubic(300),
              //origin: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.labels,
            resourceKey: resources.font.key
          })
        }
      }
    })
  });

  await surface.ready;
  return surface;
}

async function start() {
  const container = document.getElementById('main');
  if (!container) return;

  const names: string[] = [];
  const letters: string[] = ['adabcde', 'bddadfaa', 'ewqc', 'deee', 'eeee', 'daff', 'gdaf', 'h', 'i', 'j', 'k', 'l'];
  for (let i = 0; i < 100; i++) {
    const index1 = Math.floor(i / 12);
    const index2 = i % 12;
    names.push(`${letters[index1]}${letters[index2]}`);
  }

  // Generate the surface for rendering the axis into
  const surface = await makeSurface(container);
  // Make the debugging console
  buildConsole();

  console.log('READY');

  // Make our axis component
  axis1 = new Axis({
    view: {
      origin: [200, 550],
      size: [1200, 500],
    },
    labels: names,
    providers: surface.providers,
    labelColor: [1, 0.5, 0, 1],
    labelSize: 22,
    labelPadding: 15,
    tickWidth: 2,
    tickLength: 10,
    type: AxisDataType.LABEL,
    verticalLayout: false
  });

  axis2 = new Axis({
    view: {
      origin: [420, 700],
      size: [1200, 500],
    },
    labels: names,
    providers: surface.providers,
    labelColor: [0, 0.5, 0.8, 1],
    labelSize: 20,
    labelPadding: 15,
    tickWidth: 2,
    tickLength: 10,
    type: AxisDataType.NUMBER,
    numberRange: [-2725120736, -2372919733], //[1, 10000000000],
    numberGap: 1,
    verticalLayout: false
  });

  axis3 = new Axis({
    view: {
      origin: [640, 850],
      size: [1200, 500],
    },
    labels: names,
    providers: surface.providers,
    labelColor: [1, 0, 0.5, 1],
    labelSize: 18,
    labelPadding: 15,
    tickWidth: 2,
    tickLength: 10,
    type: AxisDataType.DATE,
    startDate: "01/08/2020",
    endDate: new Date(2136, 1, 1),
    verticalLayout: false
  });

  console.log(surface.providers.labels === axis1.store.providers.labels);
}

start();
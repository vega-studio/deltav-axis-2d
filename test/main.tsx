import { Axis, LabelAxis, NumberAxis, DateAxis } from "src";
import { AxisDataType } from "src/types";
import { AutoEasingMethod, createLayer, createView, View2D, EdgeLayer, LabelLayer, ClearFlags, SimpleEventHandler, IMouseInteraction, BasicSurface, Camera2D, BasicCamera2DController, EdgeType, Vec2, InstanceProvider, EdgeInstance, LabelInstance, createFont, FontMapGlyphType } from "deltav";
import * as dat from "dat.gui";
import moment = require("moment");

let axis1: LabelAxis;
let axis2: NumberAxis;
let axis3: DateAxis;

const parameters = {
  toggleLayout: () => {
    if (axis1) axis1.store.changeAxis();
    if (axis2) axis2.store.changeAxis();
    if (axis3) axis3.store.changeAxis();
  },
  resize: () => {
    if (axis1) axis1.store.setView({
      origin: [200 + 50 * Math.random(), 550 + 50 * Math.random()],
      size: [700 + 300 * Math.random(), 600 + 200 * Math.random()]
    });

    if (axis2) axis2.store.setView({
      origin: [400 + 50 * Math.random(), 700 + 50 * Math.random()],
      size: [800 + 300 * Math.random(), 600 + 200 * Math.random()]
    });

    if (axis3) axis3.store.setView({
      origin: [600 + 50 * Math.random(), 800 + 50 * Math.random()],
      size: [900 + 300 * Math.random(), 600 + 200 * Math.random()]
    });
  },
  setDateRange: () => {
    if (axis2) axis2.store.setRange(-20, 120);
    if (axis3) axis3.store.setRange(new Date(2019, 0, 8), new Date(2020, 7, 10));
  }
}

function buildConsole() {
  const ui = new dat.GUI();
  ui.add(parameters, 'toggleLayout');
  ui.add(parameters, 'resize');
  ui.add(parameters, "setDateRange");
}

async function makeSurface(container: HTMLElement) {
  let mouse: Vec2 = [0, 0];

  const surface = new BasicSurface({
    container,
    providers: {
      ticks1: new InstanceProvider<EdgeInstance>(),
      ticks2: new InstanceProvider<EdgeInstance>(),
      ticks3: new InstanceProvider<EdgeInstance>(),
      labels1: new InstanceProvider<LabelInstance>(),
      labels2: new InstanceProvider<LabelInstance>(),
      labels3: new InstanceProvider<LabelInstance>()
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
          if (axis1) axis1.shift(offset);
          if (axis2) axis2.shift(offset);
          if (axis3) axis3.shift(offset);
          return [0, 0, 0];
        },
        scaleFilter: (scale: [number, number, number]) => {
          if (axis1) axis1.zoom(mouse, scale);
          if (axis2) axis2.zoom(mouse, scale)
          if (axis3) axis3.zoom(mouse, scale)
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
          ticks1: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks1,
            type: EdgeType.LINE,
          }),
          labels1: createLayer(LabelLayer, {
            data: providers.labels1,
            resourceKey: resources.font.key
          }),
          ticks2: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks2,
            type: EdgeType.LINE,
          }),
          labels2: createLayer(LabelLayer, {
            data: providers.labels2,
            resourceKey: resources.font.key
          }),
          ticks3: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks3,
            type: EdgeType.LINE,
          }),
          labels3: createLayer(LabelLayer, {
            data: providers.labels3,
            resourceKey: resources.font.key
          })
        }
      }
    })
  });

  await surface.ready;
  return surface;
}

function resizeAll() {
  if (axis1) axis1.store.resize();
  if (axis2) axis2.store.resize();
  if (axis3) axis3.store.resize();
}

window.onresize = resizeAll;

async function start() {
  const container = document.getElementById('main');
  if (!container) return;

  const names: string[] = [];
  const letters: string[] = ['adabcde', 'bddadfaa', 'ewqc', 'deee', 'eeee', 'daff', 'gdaf', 'h', 'i', 'j', 'k', 'l'];
  for (let i = 0; i < 300; i++) {
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
  axis1 = new LabelAxis({
    childrenNumber: 3,
    displayRangeLabels: true,
    labelColor: [1, 0.5, 0, 1],
    labelFontSize: 22,
    labelPadding: 15,
    labels: names,
    maxLabelLength: 10,
    providers: {
      ticks: surface.providers.ticks1,
      labels: surface.providers.labels1
    },
    tickColor: [0.7, 0.0, 0.8, 1.0],
    tickLength: 15,
    tickWidth: 2,
    verticalLayout: false,
    view: {
      origin: [200, 550],
      size: [1200, 500],
    },
    onDisplayRange: (_range: [string, string]) => {
      return ["", ""]
    },
    onMainLabelInstance: (label: LabelInstance) => {
      label.fontSize = 10;
    },
    onTickInstance: (tick: EdgeInstance) => {
      tick.setEdgeThickness(2);
    }
  })

  axis2 = new NumberAxis({
    childrenNumber: 5,
    labelColor: [0, 0.5, 0.8, 1],
    labelFontSize: 20,
    labelPadding: 15,
    numberRange: [-2725120736, -2372919733],
    numberGap: 0.378745868,
    providers: {
      ticks: surface.providers.ticks2,
      labels: surface.providers.labels2
    },
    tickColor: [0.7, 0.8, 0.0, 1],
    tickLength: 10,
    tickWidth: 2,
    verticalLayout: false,
    view: {
      origin: [420, 700],
      size: [1200, 500],
    },
    onDisplayRange: (range: [number, number]) => {
      return [range[0].toLocaleString(), range[1].toPrecision()]
    },
    onTickInstance: (tick: EdgeInstance) => {
      tick.thickness = [3, 3];
    }
  });

  axis3 = new DateAxis({
    startDate: new Date(2019, 6, 9, 21, 0, 1, 1),
    endDate: new Date(2029, 6, 10, 21, 59, 0),
    labelColor: [1, 0, 0.5, 1],
    labelFontSize: 18,
    labelPadding: 20,
    providers: {
      ticks: surface.providers.ticks3,
      labels: surface.providers.labels3
    },
    tickColor: [0, 0.7, 0.8, 1.0],
    tickWidth: 2,
    tickLength: 10,
    verticalLayout: false,
    view: {
      origin: [640, 850],
      size: [1200, 500],
    },
    onDisplayRange: (range: [Date, Date]) => {
      return [range[0].toDateString(), range[1].toDateString()]
    },
    onSubLabelInstance: (label: LabelInstance) => {
      label.letterSpacing = 3;
    }
  });

  console.log(axis1 && surface.providers.labels1 === axis1.store.providers.labels);
}

start();
import { Axis } from "src";
import { travelDates, getLength, getIntervalLengths, dateLevel } from "src/util/dateUtil";
import { AxisDataType } from "src/types";
import { AutoEasingMethod, createLayer, createView, View2D, EdgeLayer, LabelLayer, ClearFlags, SimpleEventHandler, IMouseInteraction, BasicSurface, Camera2D, BasicCamera2DController, EdgeType, Vec2, InstanceProvider, EdgeInstance, LabelInstance, createFont, FontMapGlyphType } from "deltav";
import * as dat from "dat.gui";

let axis: Axis;

const parameters = {
  toggleLayout: () => {
    axis.store.verticalLayout = !axis.store.verticalLayout;
    axis.store.updateChartMetrics();
    axis.store.layoutLabels();
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
          axis.shift(offset);
          return [0, 0, 0];
        },
        scaleFilter: (scale: [number, number, number]) => {
          //console.warn("scale", view);
          axis.zoom(mouse, scale)
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

  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const month = 8;
  const startDate = new Date(2019, month, 10);
  const endDate1 = new Date(2020, month + 2, monthDays[month]);

  console.log(getLength(new Date(2019, 2, 10), new Date(2119, 11, 6)))

  const labels: dateLevel[] = [];
  travelDates(startDate, endDate1, labels);
  console.log(labels);

  const lengths = getIntervalLengths(startDate, endDate1);
  console.log(lengths);

  // Generate the surface for rendering the axis into
  const surface = await makeSurface(container);
  // Make the debugging console
  buildConsole();

  console.log('READY');

  // Make our axis component
  axis = new Axis({
    labels: names,
    padding: {
      left: 0.02,
      right: 0.02,
      top: 0.02,
      bottom: 0.04
    },
    providers: surface.providers,
    labelColor: [1, 0.5, 0, 1],
    labelSize: 18,
    labelPadding: 15,
    lineWidth: 3,
    tickWidth: 2,
    tickLength: 10,
    type: AxisDataType.LABEL,
    startDate: "01/08/2020",
    endDate: new Date(2030, 1, 1),
    numberRange: [1, 100],
    numberGap: 0.369,
  });

  console.log(surface.providers.labels === axis.store.providers.labels);
}

start();
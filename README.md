# DeltaV Axis 2D Component

This is a component designed to render an axis within the 2D system for deltav.

It's goal is to make a uniform easy to use axis that displays and converts ranges with ease from and to screen space.

## Installation

```sh
npm i -DE deltav-axis-2d
```

## Use

The idea of deltav componentry is to simply make a surface yourself to dictate the rendering strategy and pipeline,
then you pass providers to the component that the component expects. In this case: an edge and label instance provider.

```javascript
new Axis({
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
```

import ReactDOM from "react-dom";
import React from "react";
import { Color } from "deltav";
import { Axis } from "src";

function start() {
  const containter = document.getElementById('main');
  if (!containter) return;

  ReactDOM.render(
    <Axis
      labels={["a", "b", "c"]}
      padding={
        {
          left: 0.02,
          right: 0.02,
          top: 0.02,
          bottom: 0.02
        }
      }
    />, containter);
}

start();
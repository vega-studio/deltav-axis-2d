import ReactDOM from "react-dom";
import React from "react";
import { Color } from "deltav";
import { Axis } from "src";

function start() {
  const containter = document.getElementById('main');
  if (!containter) return;

  const names: string[] = [];
  const letters: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  for (let i = 0; i < 100; i++) {
    const index1 = Math.floor(i / 12);
    const index2 = i % 12;
    names.push(`${letters[index1]}${letters[index2]}`);
  }

  ReactDOM.render(
    <Axis
      labels={names}
      padding={
        {
          left: 0.02,
          right: 0.02,
          top: 0.02,
          bottom: 0.04
        }
      }
    />, containter);
}

start();
import ReactDOM from "react-dom";
import React from "react";
import { Axis } from "src";
import { travelDates, getLength, getIntervalLengths, dateLevel } from "src/util/dateUtil";
import { AxisDataType } from "src/types";

function start() {
  const containter = document.getElementById('main');
  if (!containter) return;

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
      labelFont={"MicroSoft"}
      labelColor={[1, 0.5, 0, 1]}
      labelSize={18}
      labelPadding={15}
      lineWidth={3}
      tickWidth={2}
      tickLength={10}
      type={AxisDataType.LABEL}
      startDate={"01/08/2020"}
      endDate={new Date(2030, 1, 1)}
      numberRange={[1, 100]}
      numberGap={0.369}
    />, containter);
}

start();
import moment from 'moment';

const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// month with 28 days
const intLengths28 = [1, 3, 7, 14, 28];

// month with 29 days
const intLengths29 = [1, 3, 7, 14, 29];

// month with 30 days
const intLengths30 = [1, 3, 7, 15, 30];

// month with 31 days
const intLengths31 = [1, 3, 7, 15, 31];

// days: 1, 3, 7, 14/15, 28/29/30/31, 90/91, 191/192, 365/366, x2, x4, x8,....
const monthsLength = [1, 3, 6, 12];

const intLengthsRegYear = [28, 90, 191, 365];
const intLengthsLeapYear = [29, 91, 192, 366];

const SEC_LEN = 1000;
const MIN_LEN = 60 * SEC_LEN;
const HOU_LEN = 60 * MIN_LEN;
const DAY_LEN = 24 * HOU_LEN;

function isLeapYear(year: number) {
  const div4: boolean = year % 4 === 0;
  const div100: boolean = year % 100 === 0;
  const div400: boolean = year % 400 === 0;

  return (!div100 && div4) || div400;
}

export type dateLevel = {
  year: number;
  month: number;
  day: number;
  level: number;
}

function insert(
  baseIndex: number,
  index: number,
  s: number,
  e: number,
  indices: number[]
) {
  if (index >= s && index <= e) indices.push(index + baseIndex - 1);
}

function getIndicesInASec(
  origin: Date,
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  sec: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const time = new Date(year, month, day, hour, min, sec);
  const baseIndex = moment(time).diff(origin, 'milliseconds');

  const hl = higherLevel < 6 ? higherLevel : 5;

  for (let l = lowerLevel; l <= hl; l++) {
    if (l === 0) {
      for (let i = s; i <= e; i++) {
        if (i % 5 !== 0) indices.push(baseIndex + i);
      }
    } else if (l === 1) {
      const start = Math.ceil(s / 5) * 5;
      const end = Math.floor(e / 5) * 5;
      for (let i = start; i <= end; i += 5) {
        if (i % 10 !== 0) indices.push(baseIndex + i);
      }
    } else if (l === 2) {
      const start = Math.ceil(s / 10) * 10;
      const end = Math.floor(e / 10) * 10;
      for (let i = start; i <= end; i += 10) {
        if (i % 50 !== 0) indices.push(baseIndex + i);
      }
    } else if (l === 3) {
      const start = Math.ceil(s / 50) * 50;
      const end = Math.floor(e / 50) * 50;
      for (let i = start; i <= end; i += 50) {
        if (i % 100 !== 0) indices.push(baseIndex + i);
      }
    } else if (l === 4) {
      const start = Math.ceil(s / 100) * 100;
      const end = Math.floor(e / 100) * 100;
      for (let i = start; i <= end; i += 100) {
        if (i % 500 !== 0) indices.push(baseIndex + i);
      }
    } else if (l === 5) {
      if (500 >= s && 500 <= e) indices.push(baseIndex + 500);
    }
  }
}

function getIndicesInAMin(
  origin: Date,
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const time = new Date(year, month, day, hour, min);
  const baseIndex = moment(time).diff(origin, 'milliseconds');

  if (lowerLevel < 6) {
    const hl = higherLevel < 6 ? higherLevel : 5;
    for (let i = s; i <= e; i++) {
      getIndicesInASec(origin, year, month, day, hour, min, i, 1, 999, lowerLevel, hl, indices);
    }
  }

  const ll = lowerLevel >= 6 ? lowerLevel : 6;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 6) {
      for (let i = s; i <= e; i++) {
        if (i % 5 !== 0) indices.push(baseIndex + i * SEC_LEN);
      }
    } else if (l === 7) {
      const start = Math.ceil(s / 5) * 5;
      const end = Math.floor(e / 5) * 5;
      for (let i = start; i <= end; i += 5) {
        if (i % 15 !== 0) indices.push(baseIndex + i * SEC_LEN);
      }
    } else if (l === 8) {
      if (s <= 15 && e >= 15) indices.push(baseIndex + 15 * SEC_LEN);
      if (s <= 45 && e >= 45) indices.push(baseIndex + 45 * SEC_LEN);
    } else if (l === 9) {
      if (s <= 30 && e >= 30) indices.push(baseIndex + 30 * SEC_LEN);
    }
  }
}

function getIndicesInAHour(
  origin: Date,
  year: number,
  month: number,
  day: number,
  hour: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const time = new Date(year, month, day, hour);
  const baseIndex = moment(time).diff(origin, 'milliseconds');

  if (lowerLevel < 10) {
    const hl = higherLevel < 10 ? higherLevel : 9;
    for (let i = s; i <= e; i++) {
      getIndicesInAMin(origin, year, month, day, hour, i, 0, 59, lowerLevel, hl, indices);
    }
  }

  const ll = lowerLevel >= 10 ? lowerLevel : 10;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 10) {
      for (let i = s; i <= e; i++) {
        if (i % 5 !== 0) indices.push(baseIndex + i * MIN_LEN);
      }
    } else if (l === 11) {
      const start = Math.ceil(s / 5) * 5;
      const end = Math.floor(e / 5) * 5;
      for (let i = start; i <= end; i += 5) {
        if (i % 15 !== 0) indices.push(baseIndex + i * MIN_LEN);
      }
    } else if (l === 12) {
      if (s <= 15 && e >= 15) indices.push(baseIndex + 15 * MIN_LEN);
      if (s <= 45 && e >= 45) indices.push(baseIndex + 45 * MIN_LEN);
    } else if (l === 13) {
      if (s <= 30 && e >= 30) indices.push(baseIndex + 30 * MIN_LEN);
    }
  }
}

function insertAnHour(
  year: number,
  month: number,
  day: number,
  index: number,
  baseIndex: number,
  indices: number[]
) {
  const baseHour = new Date(year, month, day);
  const hour = new Date(year, month, day, index);
  const diff = moment(hour).diff(baseHour, 'milliseconds');
  indices.push(baseIndex + diff);

  if (moment(baseHour).isDST() && !moment(new Date(year, month, day, 23)).isDST()) {
    console.warn("DST is over!", baseHour);
    if (index === 2) {
      indices.push(baseIndex + diff + DAY_LEN)
    }
  }
}

function getIndicesInADay(
  origin: Date,
  year: number,
  month: number,
  day: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const time = new Date(year, month, day);
  const baseIndex = moment(time).diff(origin, 'milliseconds');

  if (lowerLevel < 14) {
    const hl = higherLevel < 14 ? higherLevel : 13;
    for (let i = s; i <= e; i++) {
      getIndicesInAHour(origin, year, month, day, i, 0, 59, lowerLevel, hl, indices);
    }
  }

  const ll = lowerLevel >= 14 ? lowerLevel : 14;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 14) {
      for (let i = s; i <= e; i++) {
        if (i % 3 !== 0) insertAnHour(year, month, day, i, baseIndex, indices);
      }
    } else if (l === 15) {
      const start = Math.ceil(s / 3) * 3;
      const end = Math.floor(e / 3) * 3;

      for (let i = start; i <= end; i += 3) {
        if (i % 6 !== 0) insertAnHour(year, month, day, i, baseIndex, indices);
      }
    } else if (l === 16) {
      if (s <= 6 && e >= 6) insertAnHour(year, month, day, 6, baseIndex, indices);
      if (s <= 18 && e >= 18) insertAnHour(year, month, day, 18, baseIndex, indices);
    } else if (l === 17) {
      if (s <= 12 && e >= 12) insertAnHour(year, month, day, 12, baseIndex, indices);
    }
  }
}

function getIndices28(
  y: number,
  origin: Date,
  s: number,
  e: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  const monthStartDay = new Date(y, 1, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'days');
  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1;
  const hl = higherLevel && higherLevel < 4 ? higherLevel : 4;

  for (let i = ll; i <= hl; i++) {
    if (i === 4) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 3) {
      insert(baseIndex, 15, s, e, indices);
    } else if (i === 2) {
      insert(baseIndex, 8, s, e, indices);
      insert(baseIndex, 22, s, e, indices);
    } else if (i === 1) {
      insert(baseIndex, 4, s, e, indices);
      insert(baseIndex, 11, s, e, indices);
      insert(baseIndex, 18, s, e, indices);
      insert(baseIndex, 25, s, e, indices);
    }
  }

  return indices;
}

// 18, 19, 20, 21, 22
function getIndices282(
  origin: Date,
  year: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (lowerLevel < 18) {
    const hl = higherLevel < 18 ? higherLevel : 17;
    for (let i = s; i <= e; i++) {
      getIndicesInADay(origin, year, 1, i, 0, 23, lowerLevel, hl, indices);
    }
  }

  const monthStartDay = new Date(year, 1, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'milliseconds');

  const ll = lowerLevel >= 18 ? lowerLevel : 18;
  for (let l = ll; l <= higherLevel; l++) {
    if (l === 18) {
      const nums = [2, 3, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 23, 24, 26, 27, 28];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, 1, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 19) {
      const nums = [4, 11, 18, 25];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, 1, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 20) {
      if (8 >= s && 8 <= e) insertADay(year, 1, 8, monthStartDay, baseIndex, indices);
      if (22 >= s && 22 <= e) insertADay(year, 1, 22, monthStartDay, baseIndex, indices);
    } else if (l === 21) {
      if (15 >= s && 15 <= e) insertADay(year, 1, 15, monthStartDay, baseIndex, indices);
    }
  }
}

function getIndices29(
  y: number,
  origin: Date,
  s: number,
  e: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  const monthStartDay = new Date(y, 1, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'days');
  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1;
  const hl = higherLevel && higherLevel < 4 ? higherLevel : 4;


  for (let i = ll; i <= hl; i++) {
    if (i === 4) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 3) {
      insert(baseIndex, 15, s, e, indices);
    } else if (i === 2) {
      insert(baseIndex, 8, s, e, indices);
      insert(baseIndex, 22, s, e, indices);
    } else if (i === 1) {
      insert(baseIndex, 4, s, e, indices);
      insert(baseIndex, 11, s, e, indices);
      insert(baseIndex, 18, s, e, indices);
      insert(baseIndex, 26, s, e, indices);
    }
  }

  return indices;
}

function getIndices292(
  origin: Date,
  year: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (lowerLevel < 18) {
    const hl = higherLevel < 18 ? higherLevel : 17;
    for (let i = s; i <= e; i++) {
      getIndicesInADay(origin, year, 1, i, 0, 23, lowerLevel, hl, indices);
    }
  }

  const monthStartDay = new Date(year, 1, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'milliseconds');

  const ll = lowerLevel >= 18 ? lowerLevel : 18;
  for (let l = ll; l <= higherLevel; l++) {
    if (l === 18) {
      const nums = [2, 3, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 23, 24, 25, 27, 28, 29];

      for (const index of nums) {
        if (index >= s && index <= e) {
          indices.push(baseIndex + (index - 1) * DAY_LEN);
        }
      }
    } else if (l === 19) {
      const nums = [4, 11, 18, 26];

      for (const index of nums) {
        if (index >= s && index <= e) {
          indices.push(baseIndex + (index - 1) * DAY_LEN);
        }
      }
    } else if (l === 20) {
      if (8 >= s && 8 <= e) indices.push(baseIndex + 7 * DAY_LEN);
      if (22 >= s && 22 <= e) indices.push(baseIndex + 21 * DAY_LEN);
    } else if (l === 21) {
      if (15 >= s && 15 <= e) indices.push(baseIndex + 14 * DAY_LEN);
    }
  }
}

function getIndices30(
  y: number,
  m: number,
  origin: Date,
  s: number,
  e: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  const monthStartDay = new Date(y, m, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'days');
  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1;
  const hl = higherLevel && higherLevel < 5 ? higherLevel : 5;


  for (let i = ll; i <= hl; i++) {
    if (i === 5 && m === 3) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 4 && m !== 3) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 3) {
      insert(baseIndex, 16, s, e, indices);
    } else if (i === 2) {
      insert(baseIndex, 8, s, e, indices);
      insert(baseIndex, 23, s, e, indices);
    } else if (i === 1) {
      insert(baseIndex, 4, s, e, indices);
      insert(baseIndex, 12, s, e, indices);
      insert(baseIndex, 19, s, e, indices);
      insert(baseIndex, 27, s, e, indices);
    }
  }

  return indices;
}

function insertADay(
  year: number,
  month: number,
  index: number,
  monthStartDay: Date,
  baseIndex: number,
  indices: number[]
) {
  const day = new Date(year, month, index);
  const diff = moment(day).diff(monthStartDay, 'milliseconds');
  indices.push(baseIndex + diff);
}

function getIndices302(
  origin: Date,
  year: number,
  month: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (lowerLevel < 18) {
    const hl = higherLevel < 18 ? higherLevel : 17;
    for (let i = s; i <= e; i++) {
      getIndicesInADay(origin, year, month, i, 0, 23, lowerLevel, hl, indices);
    }
  }

  const monthStartDay = new Date(year, month, 1);

  const baseIndex = moment(monthStartDay).diff(origin, 'milliseconds');

  const ll = lowerLevel >= 18 ? lowerLevel : 18;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 18) {
      const nums = [2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 26, 28, 29, 30];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, month, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 19) {
      const nums = [4, 12, 19, 27];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, month, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 20) {
      if (8 >= s && 8 <= e) insertADay(year, month, 8, monthStartDay, baseIndex, indices);
      if (23 >= s && 23 <= e) insertADay(year, month, 23, monthStartDay, baseIndex, indices);
    } else if (l === 21) {
      if (15 >= s && 15 <= e) insertADay(year, month, 15, monthStartDay, baseIndex, indices);
    }
  }
}

function getIndices31(
  y: number,
  m: number,
  origin: Date,
  s: number,
  e: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  const monthStartDay = new Date(y, m, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'days');
  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1;
  const hl = higherLevel && higherLevel < 7 ? higherLevel : 7;


  for (let i = ll; i <= hl; i++) {
    if (i === 7 && m === 0) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 6 && m === 6) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 5 && m === 9) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 4 && m % 3 !== 0) {
      insert(baseIndex, 1, s, e, indices);
    } else if (i === 3) {
      insert(baseIndex, 16, s, e, indices);
    } else if (i === 2) {
      insert(baseIndex, 8, s, e, indices);
      insert(baseIndex, 24, s, e, indices);
    } else if (i === 1) {
      insert(baseIndex, 4, s, e, indices);
      insert(baseIndex, 12, s, e, indices);
      insert(baseIndex, 20, s, e, indices);
      insert(baseIndex, 28, s, e, indices);
    }
  }

  return indices;
}

function getIndices312(
  origin: Date,
  year: number,
  month: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (lowerLevel < 18) {
    const hl = higherLevel < 18 ? higherLevel : 17;
    for (let i = s; i <= e; i++) {
      getIndicesInADay(origin, year, month, i, 0, 23, lowerLevel, hl, indices);
    }
  }

  const monthStartDay = new Date(year, month, 1);
  const baseIndex = moment(monthStartDay).diff(origin, 'milliseconds');

  const ll = lowerLevel >= 18 ? lowerLevel : 18;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 18) {
      const nums = [2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 25, 26, 27, 29, 30, 31];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, month, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 19) {
      const nums = [4, 12, 20, 28];

      for (const index of nums) {
        if (index >= s && index <= e) {
          insertADay(year, month, index, monthStartDay, baseIndex, indices);
        }
      }
    } else if (l === 20) {
      if (8 >= s && 8 <= e) insertADay(year, month, 8, monthStartDay, baseIndex, indices);
      if (24 >= s && 24 <= e) insertADay(year, month, 24, monthStartDay, baseIndex, indices);
    } else if (l === 21) {
      if (16 >= s && 16 <= e) insertADay(year, month, 16, monthStartDay, baseIndex, indices);
    }
  }
}

function getIndicesInAMonth2(
  origin: Date,
  year: number,
  month: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (month == 1) {
    if (isLeapYear(year)) {
      getIndices292(origin, year, s, e, lowerLevel, higherLevel, indices);
    } else {
      getIndices282(origin, year, s, e, lowerLevel, higherLevel, indices);
    }
  } else if (month === 3 || month === 5 || month === 8 || month === 10) {
    getIndices302(origin, year, month, s, e, lowerLevel, higherLevel, indices);
  } else {
    getIndices312(origin, year, month, s, e, lowerLevel, higherLevel, indices);
  }
}

function getIndicesInAYear2(
  origin: Date,
  year: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  if (lowerLevel < 22) {
    const hl = higherLevel < 22 ? higherLevel : 21;
    for (let i = s; i <= e; i++) {
      const end = getMonthLength(year, i);
      getIndicesInAMonth2(origin, year, i, 1, end, lowerLevel, higherLevel, indices);
    }
  }

  const ll = lowerLevel < 22 ? 22 : lowerLevel;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 22) {
      for (let i = s; i <= e; i++) {
        if (i % 3 !== 0) {
          const firstDay = new Date(year, i, 1);
          const index = moment(firstDay).diff(origin, "milliseconds");
          indices.push(index);
        }
      }
    } else if (l === 23) {
      const nums = [3, 9];

      for (const i of nums) {
        if (i >= s && i <= e) {
          const firstDay = new Date(year, i, 1);
          const index = moment(firstDay).diff(origin, "milliseconds");
          indices.push(index);
        }
      }
    } else if (l === 24) {
      if (6 >= s && 6 <= e) {
        const firstDay = new Date(year, 6, 1);
        const index = moment(firstDay).diff(origin, "milliseconds");
        indices.push(index);
      }
    }
  }
}

function getIndicesInAMonth(
  y: number,
  m: number,
  origin: Date,
  s: number,
  e: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  if (m == 1) {
    if (isLeapYear(y)) {
      getIndices29(y, origin, s, e, indices, lowerLevel, higherLevel);
    } else {
      getIndices28(y, origin, s, e, indices, lowerLevel, higherLevel);
    }
  } else if (m === 3 || m === 5 || m === 8 || m === 10) {
    getIndices30(y, m, origin, s, e, indices, lowerLevel, higherLevel);
  } else {
    getIndices31(y, m, origin, s, e, indices, lowerLevel, higherLevel);
  }
}

function getMonthIndices(
  y: number,
  m: number,
  origin: Date,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  if (m == 1) {
    if (isLeapYear(y)) {
      getIndices29(y, origin, 1, 29, indices, lowerLevel, higherLevel);
    } else {
      getIndices28(y, origin, 1, 28, indices, lowerLevel, higherLevel);
    }
  } else if (m === 3 || m === 5 || m === 8 || m === 10) {
    getIndices30(y, m, origin, 1, 30, indices, lowerLevel, higherLevel);
  } else {
    getIndices31(y, m, origin, 1, 31, indices, lowerLevel, higherLevel);
  }
}

function getIndicesInAYear(
  year: number,
  origin: Date,
  startMonth: number,
  endMonth: number,
  indices: number[],
  lowerLevel?: number,
  higherLevel?: number
) {
  for (let m = startMonth; m <= endMonth; m++) {
    getMonthIndices(year, m, origin, indices, lowerLevel, higherLevel);
  }
}

function getDays(year: number, month: number) {
  if (month === 1) {
    if (isLeapYear(year)) return 29;
    else return 28;
  }

  if (month === 3 || month === 5 || month === 8 || month === 10) {
    return 30;
  }

  return 31;
}

export function getIndices2(
  origin: Date,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  lowerLevel: number,
  higherLevel: number
) {
  const indices: number[] = [];

  for (let level = lowerLevel; level <= higherLevel; level++) {
    getIndicesAtLevel(origin, startDate, endDate, totalYears, level, indices);
  }

  return indices;
}

// This returns all the dates' index from start date to end date at specific level 
export function getIndices(
  origin: Date,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  lowerLevel?: number,
  higherLevel?: number
) {
  const indices: number[] = [];

  const oy = origin.getFullYear();
  const om = origin.getMonth();
  const od = origin.getDate();

  const sy = startDate.getFullYear();
  const ey = endDate.getFullYear();

  const sm = startDate.getMonth();
  const em = endDate.getMonth();

  const sd = startDate.getDate();
  const ed = endDate.getDate();

  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1;

  if (ll >= 7) {
    const baseYear = om == 0 && od == 1 ? oy : oy + 1;
    const maxLevel = Math.floor(Math.log2(totalYears)) + 7;
    const visited: Set<Number> = new Set<Number>();

    let hl = maxLevel;
    if (higherLevel && higherLevel < maxLevel) hl = higherLevel;

    for (let i = hl; i >= ll; i--) {
      const yearInterval = Math.pow(2, i - 7);
      let y = baseYear;

      while (y <= ey) {
        if (!visited.has(y)
          && (
            (y !== baseYear && (y - baseYear) % (2 * yearInterval) !== 0) ||
            (y === baseYear && i === maxLevel)
          )
        ) {
          const firstDay = new Date(y, 0, 1);

          if (moment(firstDay).isBetween(startDate, endDate, null, "[]")) {
            const index = moment(firstDay).diff(origin, 'days');
            indices.push(index);
            visited.add(y);
          }
        }

        y += yearInterval;
      }
    }

  } else if (ll > 0 && ll < 7) {
    let hl = higherLevel && higherLevel < 7 ? higherLevel : 7;

    if (sy === ey) {
      if (sm === em) {
        getIndicesInAMonth(sy, sm, origin, sd, ed, indices, ll, hl);
      } else {
        getIndicesInAMonth(sy, sm, origin, sd, getDays(sy, sm), indices, ll, hl);
        getIndicesInAYear(sy, origin, sm + 1, em - 1, indices, ll, hl);
        getIndicesInAMonth(sy, em, origin, 1, ed, indices, ll, hl);
      }
    } else {
      getIndicesInAMonth(sy, sm, origin, sd, getDays(sy, sm), indices, ll, hl);
      getIndicesInAYear(sy, origin, sm + 1, 11, indices, ll, hl);

      for (let y = sy + 1; y <= ey - 1; y++) {
        getIndicesInAYear(y, origin, 0, 11, indices, ll, hl);
      }

      getIndicesInAYear(ey, origin, 0, em - 1, indices, ll, hl);
      getIndicesInAMonth(ey, em, origin, 1, ed, indices, ll, hl);
    }
  }

  return indices;
}

export function getIndicesAtLevel(
  origin: Date,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  level: number,
  indices: number[]
) {
  const oy = origin.getFullYear();
  const om = origin.getMonth();
  const od = origin.getDate();

  const sy = startDate.getFullYear();
  const ey = endDate.getFullYear();

  const sm = startDate.getMonth();
  const em = endDate.getMonth();

  const sd = startDate.getDate();
  const ed = endDate.getDate();

  // Year interval 2 ^ (n - 25)
  if (level >= 25) {
    const maxLevel = Math.floor(Math.log2(totalYears)) + 25;

    const yearInterval = Math.pow(2, level - 25);
    const baseYear = om == 0 && od == 1 ? oy : oy + 1;
    // console.warn(`~~~ maxLevel ${maxLevel} ~~~ yearInt ${yearInterval} ~~~ baseYear ${baseYear}`);

    if (level === maxLevel) {
      const firstDay = new Date(baseYear, 0, 1);

      if (moment(firstDay).isBetween(startDate, endDate, null, "[]")) {
        const index = moment(firstDay).diff(origin, 'milliseconds');
        indices.push(index);
      }
    }

    let year = baseYear + yearInterval;

    while (year <= ey) {
      const firstDay = new Date(year, 0, 1);

      if (moment(firstDay).isBetween(startDate, endDate, null, "[]")) {
        const index = moment(firstDay).diff(origin, 'milliseconds');
        indices.push(index);
      }

      year += yearInterval * 2;
    }
  }

  // Within a year
  else if (level >= 22) {
    const startMonth = sd == 1 ? sm : sm + 1;

    if (sy === ey) {
      getIndicesInAYear2(origin, sy, startMonth, em, level, level, indices)
    } else {
      getIndicesInAYear2(origin, sy, startMonth, 11, level, level, indices);

      for (let y = sy + 1; y <= ey - 1; y++) {
        getIndicesInAYear2(origin, y, 0, 11, level, level, indices);
      }

      getIndicesInAYear2(origin, ey, 0, em, level, level, indices);
    }

  }

  // Within a month
  else if (level >= 18) {
    if (sy === ey) {
      if (sm === em) {
        getIndicesInAMonth2(origin, sy, sm, sd, ed, level, level, indices);
      } else {
        getIndicesInAMonth2(origin, sy, sm, sd, getDays(sy, sm), level, level, indices);

        for (let m = sm + 1; m < em; m++) {
          getIndicesInAMonth2(origin, sy, m, 1, getDays(sy, m), level, level, indices);
        }

        getIndicesInAMonth2(origin, sy, em, 1, ed, level, level, indices);
      }
    } else {
      getIndicesInAMonth2(origin, sy, sm, sd, getDays(sy, sm), level, level, indices);

      for (let m = sm + 1; m < 12; m++) {
        getIndicesInAMonth2(origin, sy, m, 1, getDays(sy, m), level, level, indices);
      }

      for (let y = sy + 1; y < ey; y++) {
        getIndicesInAYear2(origin, y, 0, 11, level, level, indices);
      }

      for (let m = 0; m < em; m++) {
        getIndicesInAMonth2(origin, ey, m, 1, getDays(ey, m), level, level, indices);
      }

      getIndicesInAMonth2(origin, ey, em, 1, ed, level, level, indices);
    }
  }

  // Within a day
  else if (level >= 14) {
    const sh = startDate.getMinutes() === 0 ? startDate.getHours() : startDate.getHours() + 1;
    const eh = endDate.getHours();

    if (sy === ey && sm === em && sd === ed) {
      getIndicesInADay(origin, sy, sm, sd, sh, eh, level, level, indices);
    } else {
      getIndicesInADay(origin, sy, sm, sd, sh, 23, level, level, indices);

      const startDay = new Date(sy, sm, sd);
      const endDay = new Date(ey, em, ed);

      const len = moment(endDay).diff(startDay, 'days');
      console.warn("diff", startDate, endDate, len);

      for (let i = 1; i < len; i++) {
        const day = moment(startDay).add(i, 'days').toDate();
        getIndicesInADay(origin, day.getFullYear(), day.getMonth(), day.getDate(), 1, 23, level, level, indices);
      }

      getIndicesInADay(origin, ey, em, ed, 1, eh, level, level, indices);
    }
  }

  // Within an hour
  else if (level >= 10) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getSeconds() === 0 ? startDate.getMinutes() : startDate.getMinutes() + 1;
    const emin = endDate.getMinutes();

    if (sy === ey && sm === em && sd === ed && sh === eh) {
      getIndicesInAHour(origin, sy, sm, sd, sh, smin, emin, level, level, indices);
    } else {
      getIndicesInAHour(origin, sy, sm, sd, sh, smin, 59, level, level, indices);

      const startHour = new Date(sy, sm, sd, sh);
      const endHour = new Date(ey, em, ed, eh);
      const len = moment(endHour).diff(startHour, 'hours');

      for (let i = 1; i < len; i++) {
        const hour = moment(startHour).add(i, 'hours').toDate();
        getIndicesInAHour(
          origin,
          hour.getFullYear(),
          hour.getMonth(),
          hour.getDate(),
          hour.getHours(),
          1,
          59,
          level,
          level,
          indices
        );
      }

      getIndicesInAHour(origin, ey, em, ed, eh, 1, emin, level, level, indices);
    }

  }

  // Within a minute
  else if (level >= 6) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getMinutes();
    const emin = endDate.getMinutes();

    const ssec = startDate.getMilliseconds() === 0 ? startDate.getSeconds() : startDate.getSeconds() + 1;
    const esec = endDate.getSeconds();

    if (sy === ey && sm === em && sd === ed && sh === eh && smin === emin) {
      getIndicesInAMin(origin, sy, sm, sd, sh, smin, ssec, esec, level, level, indices);
    } else {
      getIndicesInAMin(origin, sy, sm, sd, sh, smin, ssec, 59, level, level, indices);

      const startMin = new Date(sy, sm, sd, sh, smin);
      const endMin = new Date(ey, em, ed, eh, emin);
      const len = moment(endMin).diff(startMin, 'minutes');

      for (let i = 1; i < len; i++) {
        const min = moment(startMin).add(i, 'minutes').toDate();
        getIndicesInAMin(
          origin,
          min.getFullYear(),
          min.getMonth(),
          min.getDate(),
          min.getHours(),
          min.getMinutes(),
          1,
          59,
          level,
          level,
          indices
        );
      }

      getIndicesInAMin(origin, ey, em, ed, eh, emin, 1, esec, level, level, indices);
    }

  }

  // Within a second
  else if (level >= 0) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getMinutes();
    const emin = endDate.getMinutes();

    const ssec = startDate.getSeconds();
    const esec = endDate.getSeconds();

    const sms = startDate.getMilliseconds();
    const ems = endDate.getMilliseconds();

    if (sy === ey && sm === em && sd === ed && sh === eh && smin === emin && ssec === esec) {
      getIndicesInASec(origin, sy, sm, sd, sh, smin, ssec, sms, ems, level, level, indices);
    } else {
      getIndicesInASec(origin, sy, sm, sd, sh, smin, ssec, sms, 999, level, level, indices);

      const startSec = new Date(sy, sm, sd, sh, smin, ssec);
      const endSec = new Date(ey, em, ed, eh, emin, esec);
      const len = moment(endSec).diff(startSec, 'seconds');

      for (let i = 1; i < len; i++) {
        const sec = moment(startSec).add(i, 'seconds').toDate();
        getIndicesInASec(
          origin,
          sec.getFullYear(),
          sec.getMonth(),
          sec.getDate(),
          sec.getHours(),
          sec.getMinutes(),
          sec.getSeconds(),
          1,
          999,
          level,
          level,
          indices
        );
      }

      getIndicesInASec(origin, ey, em, ed, eh, emin, esec, 1, ems, level, level, indices);
    }
  }

  return indices;
}

export function getMaxLevel(startDate: Date, endDate: Date) {
  const daysDiff = moment(endDate).diff(startDate, 'days');
  if (daysDiff < 365) return 7;
  const yearsDiff = moment(endDate).diff(startDate, 'years');
  let deltaLevel = Math.floor(Math.log2(yearsDiff));
  return 7 + deltaLevel;
}

function getLevel28(day: number) {
  if (day === 15) return 21;
  if (day === 8 || day === 22) return 20;
  if (day === 4 || day === 11 || day === 18 || day === 25) return 19;
  return 18;
}

function getLevel29(day: number) {
  if (day === 15) return 21;
  if (day === 8 || day === 22) return 20;
  if (day === 4 || day === 11 || day === 18 || day === 26) return 19;
  return 18;
}

function getLevel30(day: number) {
  if (day === 15) return 21;
  if (day === 8 || day === 23) return 20;
  if (day === 4 || day === 12 || day === 19 || day === 27) return 19;
  return 18;
}

function getLevel31(day: number) {
  if (day === 16) return 21;
  if (day === 8 || day === 24) return 20;
  if (day === 4 || day === 12 || day === 20 || day === 28) return 19;
  return 18;
}

function getMonthLevel(month: number) {
  if (month === 6) return 24;
  if (month === 3 || month === 9) return 23;
  return 22;
}

function getLevel(year: number, month: number, day: number) {
  if (month === 1) {
    if (isLeapYear(year)) return getLevel29(day);
    else return getLevel28(day);
  }

  const days = monthDays[month];

  if (days === 30) return getLevel30(day);

  return getLevel31(day);
}

export function getDayLevel(origin: Date, day: Date, totalYears: number) {
  const oy = origin.getMonth() === 0 && origin.getDate() === 1 ?
    origin.getFullYear() : origin.getFullYear() + 1;

  if (day.getMonth() === 0 && day.getDate() === 1) {
    const y = day.getFullYear();
    let diff = y - oy;

    if (diff === 0) {
      return 7 + Math.floor(Math.log2(totalYears));
    } else {
      let level = 7;

      while (diff % 2 === 0) {
        diff /= 2;
        level++;
      }
      return level;
    }

  }

  return getLevel(day.getFullYear(), day.getMonth(), day.getDate());
}

export function getMomentLevel(origin: Date, moment: Date, totalYears: number) {
  const oy = origin.getMonth() === 0 && origin.getDate() === 1 ?
    origin.getFullYear() : origin.getFullYear() + 1;

  const year = moment.getFullYear();
  const month = moment.getMonth();
  const day = moment.getDate();
  const hour = moment.getHours();
  const minute = moment.getMinutes();
  const second = moment.getSeconds();
  const ms = moment.getMilliseconds();

  if (month === 0 && day === 1 && hour === 0 && minute === 0 && second === 0 && ms === 0) {
    let diff = year - oy;

    if (diff === 0) {
      return 25 + Math.floor(Math.log2(totalYears));
    } else {
      let level = 25;

      while (diff % 2 === 0) {
        diff /= 2;
        level++;
      }
      return level;
    }
  } else if (day === 1 && hour === 0 && minute === 0 && second === 0 && ms === 0) {
    return getMonthLevel(month);
  } else if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
    return getLevel(year, month, day);
  } else if (minute === 0 && second === 0 && ms === 0) {
    if (hour === 12) return 17;
    else if (hour % 6 === 0) return 16;
    else if (hour % 3 === 0) return 15;
    return 14;
  } else if (second === 0 && ms === 0) {
    if (minute === 30) return 13;
    else if (minute % 15 === 0) return 12;
    else if (minute % 5 === 0) return 11;
    return 10;
  } else if (ms === 0) {
    if (second === 30) return 9;
    else if (second % 15 === 0) return 8;
    else if (second % 5 === 0) return 7;
    return 6;
  }

  if (ms === 500) return 5;
  else if (ms % 100 === 0) return 4;
  else if (ms % 50 === 0) return 3;
  else if (ms % 10 === 0) return 2;
  else if (ms % 5 === 0) return 1;
  return 0;
}

function travelInAMonth(
  year: number,
  month: number,
  startDay: number,
  endDay: number,
  labels: dateLevel[]
) {
  for (let day = startDay; day <= endDay; day++) {
    let level = getLevel(year, month, day);
    labels.push({
      year,
      month,
      day,
      level
    });
  }
}

function travelMonth(year: number, month: number,
  labels: dateLevel[]) {
  const days = month === 1 && isLeapYear(year) ? 29 : monthDays[month];
  travelInAMonth(year, month, 1, days, labels);
}

function travelYear(year: number, labels: dateLevel[]) {
  for (let month = 0; month < 12; month++) {
    travelMonth(year, month, labels);
  }
}

function travelInAYear(
  year: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  labels: dateLevel[]
) {
  const startDays = startMonth == 1 && isLeapYear(year) ? 29 : monthDays[startMonth];
  travelInAMonth(year, startMonth, startDay, startDays, labels);

  for (let m = startMonth + 1; m < endMonth; m++) {
    travelMonth(year, m, labels);
  }

  travelInAMonth(year, endMonth, 1, endDay, labels);
}

export function travelDates(start: Date, end: Date, labels: dateLevel[]) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startYear < endYear) {
    travelInAYear(startYear, startMonth, startDay, 11, 31, labels);

    for (let y = startYear + 1; y < endYear; y++) {
      travelYear(y, labels);
    }

    travelInAYear(endYear, 0, 1, endMonth, endDay, labels);
  } else if (startYear === endYear) {
    if (startMonth === endMonth) {
      travelInAMonth(startYear, startMonth, startDay, endDay, labels);
    } else {
      travelInAYear(startYear, startMonth, startDay, endMonth, endDay, labels);
    }

  }
}

// get length
function getYearLength(year: number) {
  return isLeapYear(year) ? 366 : 365;
}

function getMonthLength(year: number, month: number) {
  if (month === 1) {
    return isLeapYear(year) ? 29 : 28;
  }

  return monthDays[month];
}

// Get Length including start and end days
export function getLength(start: Date, end: Date) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startDay = start.getDate();
  const endDay = end.getDate();

  let count = 0;

  if (startYear < endYear) {
    count += getMonthLength(startYear, startMonth) - startDay + 1;

    for (let m = startMonth + 1; m < 12; m++) {
      count += getMonthLength(startYear, m);
    }

    for (let y = startYear + 1; y < endYear; y++) {
      count += getYearLength(y);
    }

    for (let m = 0; m < endMonth; m++) {
      count += getMonthLength(endYear, m);
    }

    count += endDay;
  } else if (startYear === endYear) {
    if (startMonth < endMonth) {
      count += getMonthLength(startYear, startMonth) - startDay + 1;
      for (let m = startMonth + 1; m < endMonth; m++) {
        count += getMonthLength(startYear, m);
      }
      count += endDay;
    } else if (startMonth === endMonth) {
      count += endDay - startDay + 1;
    }
  }



  return count;
}

// get interval lengths
export function getIntervalLengths(start: Date, end: Date) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  let has28 = false;
  let has29 = false;
  let has30 = false;
  let has31 = false;

  if (startYear < endYear - 1) {
    for (let y = startYear; y <= endYear; y++) {
      if (isLeapYear(y)) has29 = true;
      else has28 = true;
    }

    has30 = true;
    has31 = true;
  } else if (startYear < endYear) {
    for (let m = startMonth; m < 12; m++) {
      if (m === 1) {
        if (isLeapYear(startYear)) has29 = true;
        else has28 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }

    for (let m = 0; m <= endMonth; m++) {
      if (m === 1) {
        if (isLeapYear(endYear)) has29 = true;
        else has28 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }
  } else if (startYear == endYear) {
    for (let m = startMonth; m <= endMonth; m++) {
      if (m === 1) {
        if (isLeapYear(startYear)) has29 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }

    has28 = !has29;
  }

  const intervals: number[] = [
    1, 3, 7
  ];


  if ((has28 || has29) && !has30 && !has31) {
    intervals.push(14)
  } else {
    intervals.push(15);
  }

  if (has28) {
    intervals.push(28);
  } else if (has29) {
    intervals.push(29);
  } else if (has30) {
    intervals.push(30);
  } else {
    intervals.push(31);
  }

  if (has29 && !has28) {
    intervals.push(91);
    intervals.push(192);
    intervals.push(366);
  } else {
    intervals.push(90);
    intervals.push(191);
    intervals.push(365);
  }

  return intervals;
}

// get interval lengths
export function getIntervalLengths2(start: Date, end: Date) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  let has28 = false;
  let has29 = false;
  let has30 = false;
  let has31 = false;

  if (startYear < endYear - 1) {
    for (let y = startYear; y <= endYear; y++) {
      if (isLeapYear(y)) has29 = true;
      else has28 = true;
    }

    has30 = true;
    has31 = true;
  } else if (startYear < endYear) {
    for (let m = startMonth; m < 12; m++) {
      if (m === 1) {
        if (isLeapYear(startYear)) has29 = true;
        else has28 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }

    for (let m = 0; m <= endMonth; m++) {
      if (m === 1) {
        if (isLeapYear(endYear)) has29 = true;
        else has28 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }
  } else if (startYear == endYear) {
    for (let m = startMonth; m <= endMonth; m++) {
      if (m === 1) {
        if (isLeapYear(startYear)) has29 = true;
      } else {
        const days = monthDays[m];
        if (days === 30) has30 = true;
        if (days === 31) has31 = true;
      }
    }

    has28 = !has29;
  }

  const intervals: number[] = [
    1,
    5,
    10,
    50,
    100,
    500,
    1 * SEC_LEN,
    5 * SEC_LEN,
    15 * SEC_LEN,
    30 * SEC_LEN,
    1 * MIN_LEN,
    5 * MIN_LEN,
    15 * MIN_LEN,
    30 * MIN_LEN,
    1 * HOU_LEN,
    3 * HOU_LEN,
    6 * HOU_LEN,
    12 * HOU_LEN,
    1 * DAY_LEN,
    3 * DAY_LEN,
    7 * DAY_LEN
  ];

  const lengths: number[] = [1, 3, 7];

  if ((has28 || has29) && !has30 && !has31) {
    intervals.push(14 * DAY_LEN)
  } else {
    intervals.push(15 * DAY_LEN);
  }

  if (has28) {
    intervals.push(28 * DAY_LEN);
  } else if (has29) {
    intervals.push(29 * DAY_LEN);
  } else if (has30) {
    intervals.push(30 * DAY_LEN);
  } else {
    intervals.push(31 * DAY_LEN);
  }

  if (has29 && !has28) {
    intervals.push(91 * DAY_LEN);
    intervals.push(192 * DAY_LEN);
    intervals.push(366 * DAY_LEN);
  } else {
    intervals.push(90 * DAY_LEN);
    intervals.push(191 * DAY_LEN);
    intervals.push(365 * DAY_LEN);
  }

  return intervals;
}
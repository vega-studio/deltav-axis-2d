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

function getIndicesInASec(
  origin: Date,
  sec: Date,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  // const time = new Date(year, month, day, hour, min, sec);
  const baseIndex = moment(sec).diff(origin, 'milliseconds');

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
  min: Date,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  // const time = new Date(year, month, day, hour, min);
  const baseIndex = moment(min).diff(origin, 'milliseconds');

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
  hour: Date,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const baseIndex = moment(hour).diff(origin, 'milliseconds');

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

function getIndicesInADay(
  origin: Date,
  day: Date,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
  const baseIndex = moment(day).diff(origin, 'milliseconds');
  const hours = moment(day).add(1, 'days').diff(day, 'hours');
  const offset = hours === 24 ? 0 : hours === 25 ? 1 : -1;
  e = Math.min(e, hours - 1);

  const ll = lowerLevel >= 14 ? lowerLevel : 14;

  for (let l = ll; l <= higherLevel; l++) {
    if (l === 14) {
      for (let i = s; i <= e; i++) {
        if (i === 1) indices.push(baseIndex + i * HOU_LEN);
        else if ((i - offset) % 3 !== 0) indices.push(baseIndex + i * HOU_LEN)
      }
    } else if (l === 15) {
      for (let i = s; i <= e; i++) {
        if ((i - offset) % 3 === 0 && (i - offset) % 6 !== 0) indices.push(baseIndex + i * HOU_LEN)
      }
    } else if (l === 16) {
      if (s <= 6 + offset && e >= 6 + offset) indices.push(baseIndex + (6 + offset) * HOU_LEN)
      if (s <= 18 + offset && e >= 18 + offset) indices.push(baseIndex + (18 + offset) * HOU_LEN)
    } else if (l === 17) {
      if (s <= 12 + offset && e >= 12 + offset) indices.push(baseIndex + (12 + offset) * HOU_LEN)
    }
  }
}

function getIndices28(
  origin: Date,
  year: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
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
  origin: Date,
  year: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
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

function getIndices30(
  origin: Date,
  year: number,
  month: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
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
  origin: Date,
  year: number,
  month: number,
  s: number,
  e: number,
  lowerLevel: number,
  higherLevel: number,
  indices: number[]
) {
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

function getIndicesInAMonth(
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
      getIndices29(origin, year, s, e, lowerLevel, higherLevel, indices);
    } else {
      getIndices28(origin, year, s, e, lowerLevel, higherLevel, indices);
    }
  } else if (month === 3 || month === 5 || month === 8 || month === 10) {
    getIndices30(origin, year, month, s, e, lowerLevel, higherLevel, indices);
  } else {
    getIndices31(origin, year, month, s, e, lowerLevel, higherLevel, indices);
  }
}

function getIndicesInAYear(
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
      getIndicesInAMonth(origin, year, i, 1, end, lowerLevel, higherLevel, indices);
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

export function getIndices(
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
    const maxLevel = (totalYears >= 1 ? Math.floor(Math.log2(totalYears)) : 0) + 25;
    const yearInterval = Math.pow(2, level - 25);
    const baseYear = om == 0 && od == 1 ? oy : oy + 1;

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
      getIndicesInAYear(origin, sy, startMonth, em, level, level, indices)
    } else {
      // Frst month
      getIndicesInAYear(origin, sy, startMonth, 11, level, level, indices);

      // Months in between
      for (let y = sy + 1; y <= ey - 1; y++) {
        getIndicesInAYear(origin, y, 0, 11, level, level, indices);
      }

      // Last month
      getIndicesInAYear(origin, ey, 0, em, level, level, indices);
    }
  }

  // Within a month
  else if (level >= 18) {
    if (sy === ey) {
      if (sm === em) {
        getIndicesInAMonth(origin, sy, sm, sd, ed, level, level, indices);
      } else {
        getIndicesInAMonth(origin, sy, sm, sd, getDays(sy, sm), level, level, indices);

        for (let m = sm + 1; m < em; m++) {
          getIndicesInAMonth(origin, sy, m, 1, getDays(sy, m), level, level, indices);
        }

        getIndicesInAMonth(origin, sy, em, 1, ed, level, level, indices);
      }
    } else {
      getIndicesInAMonth(origin, sy, sm, sd, getDays(sy, sm), level, level, indices);

      for (let m = sm + 1; m < 12; m++) {
        getIndicesInAMonth(origin, sy, m, 1, getDays(sy, m), level, level, indices);
      }

      for (let y = sy + 1; y < ey; y++) {
        getIndicesInAYear(origin, y, 0, 11, level, level, indices);
      }

      for (let m = 0; m < em; m++) {
        getIndicesInAMonth(origin, ey, m, 1, getDays(ey, m), level, level, indices);
      }

      getIndicesInAMonth(origin, ey, em, 1, ed, level, level, indices);
    }
  }

  // Within a day
  else if (level >= 14) {
    const h = moment(startDate).diff(new Date(sy, sm, sd), 'hours');
    const sh = startDate.getMinutes() === 0 ? h : h + 1;
    const eh = moment(endDate).diff(new Date(ey, em, ed), 'hours');
    const startDay = new Date(sy, sm, sd);

    if (sy === ey && sm === em && sd === ed) {
      getIndicesInADay(origin, startDay, sh, eh, level, level, indices);
    } else {
      const endDay = new Date(ey, em, ed);
      const len = moment(endDay).diff(startDay, 'days');

      // First day
      getIndicesInADay(origin, startDay, sh, 24, level, level, indices);

      // Days in between
      for (let i = 1; i < len; i++) {
        const day = moment(startDay).add(i, 'days').toDate();
        getIndicesInADay(origin, day, 1, 24, level, level, indices);
      }

      // Last day
      getIndicesInADay(origin, endDay, 1, eh, level, level, indices);
    }
  }

  // Within an hour
  else if (level >= 10) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getSeconds() === 0 ? startDate.getMinutes() : startDate.getMinutes() + 1;
    const emin = endDate.getMinutes();

    let startHour = new Date(startDate);
    startHour.setMinutes(0, 0, 0);

    if (moment(startHour).isDST() && !moment(startDate).isDST()) {
      startHour = moment(startHour).add(1, 'hours').toDate();
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getIndicesInAHour(origin, startHour, smin, emin, level, level, indices);
    } else {
      let endHour = new Date(endDate);
      endHour.setMinutes(0, 0, 0);

      if (moment(endHour).isDST() && !moment(endDate).isDST()) {
        endHour = moment(endHour).add(1, 'hours').toDate();
      }

      const len = moment(endHour).diff(startHour, 'hours');

      // First hour
      getIndicesInAHour(origin, startHour, smin, 59, level, level, indices);

      // Hours in between
      for (let i = 1; i < len; i++) {
        const hour = moment(startHour).add(i, 'hours').toDate();

        getIndicesInAHour(
          origin,
          hour,
          1,
          59,
          level,
          level,
          indices
        );
      }

      // Last hour
      getIndicesInAHour(origin, endHour, 1, emin, level, level, indices);
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

    let startMin = new Date(startDate);
    startMin.setSeconds(0, 0);

    if (moment(startMin).isDST() && !moment(startDate).isDST()) {
      startMin = moment(startMin).add(1, 'hours').toDate();
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      smin === emin &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getIndicesInAMin(origin, startMin, ssec, esec, level, level, indices);
    } else {
      let endMin = new Date(endDate);
      endMin.setSeconds(0, 0);

      if (moment(endMin).isDST() && !moment(endDate).isDST()) {
        endMin = moment(endMin).add(1, 'hours').toDate();
      }

      const len = moment(endMin).diff(startMin, 'minutes');

      // First minute
      getIndicesInAMin(origin, startMin, ssec, 59, level, level, indices);

      // Minutes in between
      for (let i = 1; i < len; i++) {
        const min = moment(startMin).add(i, 'minutes').toDate();
        getIndicesInAMin(
          origin,
          min,
          1,
          59,
          level,
          level,
          indices
        );
      }

      // Last minute
      getIndicesInAMin(origin, endMin, 1, esec, level, level, indices);
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

    let startSec = new Date(startDate);
    startSec.setMilliseconds(0);

    if (moment(startSec).isDST() && !moment(startDate).isDST()) {
      startSec = moment(startSec).add(1, 'hours').toDate()
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      smin === emin &&
      ssec === esec &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getIndicesInASec(origin, startSec, sms, ems, level, level, indices);
    } else {
      let endSec = new Date(endDate);
      endSec.setMilliseconds(0);

      if (moment(endSec).isDST() && !moment(endDate).isDST()) {
        endSec = moment(endSec).add(1, 'hours').toDate()
      }

      let len = moment(endSec).diff(startSec, 'seconds');

      // First second
      getIndicesInASec(origin, startSec, sms, 999, level, level, indices);

      // Seconds in between
      for (let i = 1; i < len; i++) {
        const sec = moment(startSec).add(i, 'seconds').toDate();
        getIndicesInASec(
          origin,
          sec,
          1,
          999,
          level,
          level,
          indices
        );
      }

      // Last second
      getIndicesInASec(origin, endSec, 1, ems, level, level, indices);
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

export function getSimpleIntervalLengths(start: Date, end: Date) {
  const intervals: number[] = [
    1, 40, 1 * SEC_LEN, 2 * SEC_LEN, 1 * MIN_LEN, 2 * MIN_LEN, 1 * HOU_LEN, 1 * DAY_LEN
  ];

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

export function getSimpleMomentLevel(origin: Date, moment: Date, totalYears: number) {
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
      return 9 + totalYears >= 1 ? Math.floor(Math.log2(totalYears)) : 0;
    } else {
      let level = 9;

      while (diff % 2 === 0) {
        diff /= 2;
        level++;
      }
      return level;
    }
  } else if (day === 1 && hour === 0 && minute === 0 && second === 0 && ms === 0) {
    return 8;
  } else if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
    return 7;
  } else if (minute === 0 && second === 0 && ms === 0) {
    return 6;
  } else if (second === 0 && ms === 0) {
    if (minute % 2 === 0) return 5;
    return 4;
  } else if (ms === 0) {
    if (second % 2 === 0) return 3;
    return 2;
  }

  if (ms % 40 === 0) return 1;
  return 0;
}

export function getSimpleIndices(
  origin: Date,
  totalYears: number,
  startDate: Date,
  endDate: Date,
  lowerLevel: number,
  higherLevel: number
) {
  const indices: number[] = [];

  for (let level = lowerLevel; level <= higherLevel; level++) {
    getSimpleIndicesAtLevel(origin, totalYears, startDate, endDate, level, indices);
  }

  return indices;
}

function getIndicesOfMonthFirstDay(
  origin: Date,
  year: number,
  startMonth: number,
  endMonth: number,
  indices: number[]
) {
  startMonth = Math.max(startMonth, 1);

  for (let month = startMonth; month <= endMonth; month++) {
    const firstDay = new Date(year, month, 1);
    const index = moment(firstDay).diff(origin, 'milliseconds');
    indices.push(index);
  }

}

function getIndicesOfDaysInAMonth(
  origin: Date,
  year: number,
  month: number,
  startDay: number,
  endDay: number,
  indices: number[]
) {
  startDay = Math.max(startDay, 2);

  for (let d = startDay; d <= endDay; d++) {
    const day = new Date(year, month, d);
    const index = moment(day).diff(origin, 'milliseconds');
    indices.push(index);
  }
}

function getSimpleIndicesInADay(
  origin: Date,
  day: Date,
  startHour: number,
  endHour: number,
  indices: number[]
) {
  const baseIndex = moment(day).diff(origin, 'milliseconds');
  const hours = moment(day).add(1, 'days').diff(day, 'hours');
  // const offset = hours === 24 ? 0 : hours === 25 ? 1 : -1;

  startHour = Math.max(startHour, 1);
  endHour = Math.min(endHour, hours - 1);

  for (let h = startHour; h <= endHour; h++) {
    indices.push(baseIndex + h * HOU_LEN);
  }
}

function getSimpleIndicesInAnHour(
  origin: Date,
  hour: Date,
  startMinute: number,
  endMinute: number,
  level: number,
  indices: number[]
) {
  const baseIndex = moment(hour).diff(origin, 'milliseconds');
  level = Math.min(Math.max(level, 4), 5);

  if (level === 5) {
    const start = Math.ceil(startMinute / 2) * 2;
    const end = Math.floor(endMinute / 2) * 2;

    for (let m = start; m <= end; m += 2) {
      indices.push(baseIndex + m * MIN_LEN);
    }
  } else {
    const start = Math.floor(startMinute / 2) * 2 + 1;
    const end = Math.ceil(endMinute / 2) * 2 - 1;

    for (let m = start; m <= end; m += 2) {
      indices.push(baseIndex + m * MIN_LEN);
    }
  }
}

function getSimpleIndicesInAMinute(
  origin: Date,
  minute: Date,
  startSecond: number,
  endSecond: number,
  level: number,
  indices: number[]
) {
  const baseIndex = moment(minute).diff(origin, 'milliseconds');
  level = Math.min(Math.max(level, 2), 3);

  if (level === 3) {
    const start = Math.ceil(startSecond / 2) * 2;
    const end = Math.floor(endSecond / 2) * 2;

    for (let s = start; s <= end; s += 2) {
      indices.push(baseIndex + s * SEC_LEN);
    }
  } else {
    const start = Math.floor(startSecond / 2) * 2 + 1;
    const end = Math.ceil(endSecond / 2) * 2 - 1;

    for (let s = start; s <= end; s += 2) {
      indices.push(baseIndex + s * SEC_LEN);
    }
  }
}

function getSimpleIndicesInASecond(
  origin: Date,
  second: Date,
  startMs: number,
  endMs: number,
  level: number,
  indices: number[]
) {
  const baseIndex = moment(second).diff(origin, 'milliseconds');
  level = Math.min(Math.max(level, 0), 1);

  if (level === 1) {
    const start = Math.ceil(startMs / 40) * 40;
    const end = Math.floor(endMs / 40) * 40;

    for (let ms = start; ms <= end; ms += 40) {
      indices.push(baseIndex + ms);
    }
  } else {
    for (let ms = startMs; ms <= endMs; ms++) {
      if (ms % 40 !== 0) indices.push(baseIndex + ms);
    }
  }
}

// ms: 1,2 sec: 3, 4, min: 5, 6 hour: 7, month: 8, year: 9 & above
function getSimpleIndicesAtLevel(
  origin: Date,
  totalYears: number,
  startDate: Date,
  endDate: Date,
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

  if (level >= 9) {
    const maxLevel = (totalYears >= 1 ? Math.floor(Math.log2(totalYears)) : 0) + 9;
    const yearInterval = Math.pow(2, level - 9);
    const baseYear = om == 0 && od == 1 ? oy : oy + 1;

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

  // In a year
  else if (level === 8) {
    const atBeginning = moment(startDate).isSame(new Date(sy, sm, 1));
    const startMonth = atBeginning ? sm : sm + 1;

    if (sy === ey) {
      getIndicesOfMonthFirstDay(origin, sy, startMonth, em, indices);
    } else {
      getIndicesOfMonthFirstDay(origin, sy, startMonth, 11, indices);

      for (let y = sy + 1; y < ey; y++) {
        getIndicesOfMonthFirstDay(origin, y, 1, 11, indices);
      }

      getIndicesOfMonthFirstDay(origin, ey, 1, em, indices);
    }

  }

  // In a month
  else if (level === 7) {
    const atBeginning = moment(startDate).isSame(new Date(sy, sm, sd, 0));
    const startDay = atBeginning ? sd : sd + 1;

    if (sy === ey) {
      if (sm === em) {
        getIndicesOfDaysInAMonth(origin, sy, sm, startDay, ed, indices);
      } else {
        getIndicesOfDaysInAMonth(origin, sy, sm, startDay, getDays(sy, sm), indices);

        for (let m = sm + 1; m < em; m++) {
          getIndicesOfDaysInAMonth(origin, sy, m, 2, getDays(sy, m), indices)
        }

        getIndicesOfDaysInAMonth(origin, sy, em, 2, ed, indices);
      }
    } else {
      getIndicesOfDaysInAMonth(origin, sy, sm, sd, getDays(sy, sm), indices);

      for (let m = sm + 1; m < 12; m++) {
        getIndicesOfDaysInAMonth(origin, sy, m, 2, getDays(sy, m), indices);
      }

      for (let y = sy + 1; y < ey; y++) {
        for (let m = 0; m < 12; m++) {
          getIndicesOfDaysInAMonth(origin, y, m, 2, getDays(y, m), indices);
        }
      }

      for (let m = 0; m < em; m++) {
        getIndicesOfDaysInAMonth(origin, ey, m, 2, getDays(ey, m), indices);
      }

      getIndicesOfDaysInAMonth(origin, ey, em, 2, ed, indices);
    }

  }

  // In a day
  else if (level === 6) {
    // start hour or end hour could be at the change point of DST
    const startDay = new Date(sy, sm, sd);
    const sh = moment(startDate).diff(startDay, 'hours');
    const atBeginning = moment(startDate).isSame(moment(startDay).add(sh, 'hours'));
    const startHour = atBeginning ? sh : sh + 1;
    const endHour = moment(endDate).diff(new Date(ey, em, ed), 'hours');

    if (sy === ey && sm === em && sd === ed) {
      getSimpleIndicesInADay(origin, startDay, startHour, endHour, indices);
    } else {
      const endDay = new Date(ey, em, ed);
      const length = moment(endDay).diff(startDay, 'days');

      getSimpleIndicesInADay(origin, startDay, startHour, 24, indices);

      for (let i = 1; i < length; i++) {
        const day = moment(startDay).add(i, 'days').toDate();
        getSimpleIndicesInADay(origin, day, 1, 24, indices);
      }

      getSimpleIndicesInADay(origin, endDay, 1, endHour, indices);
    }
  }

  // In an hour
  else if (level >= 4) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();
    const smin = startDate.getMinutes();
    const atBeginning = startDate.getMinutes() === 0 && startDate.getSeconds() === 0 && startDate.getMilliseconds() === 0;

    const startMinute = atBeginning ? smin : smin + 1;
    const endMinute = endDate.getMinutes();

    let startHour = new Date(startDate);
    startHour.setMinutes(0, 0, 0);

    if (moment(startHour).isDST() && !moment(startDate).isDST()) {
      startHour = moment(startHour).add(1, 'hours').toDate();
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getSimpleIndicesInAnHour(origin, startHour, startMinute, endMinute, level, indices);
    } else {
      let endHour = new Date(endDate);
      endHour.setMinutes(0, 0, 0);

      if (moment(endHour).isDST() && !moment(endDate).isDST()) {
        endHour = moment(endHour).add(1, 'hours').toDate();
      }

      const length = moment(endHour).diff(startHour, 'hours');

      getSimpleIndicesInAnHour(origin, startHour, startMinute, 59, level, indices);

      for (let i = 1; i < length; i++) {
        const hour = moment(startHour).add(i, 'hours').toDate();
        getSimpleIndicesInAnHour(origin, hour, 1, 59, level, indices);
      }

      getSimpleIndicesInAnHour(origin, endHour, 1, endMinute, level, indices);
    }
  }

  // In an minute
  else if (level >= 2) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getMinutes();
    const emin = endDate.getMinutes();

    const startSecond = startDate.getMilliseconds() === 0 ? startDate.getSeconds() : startDate.getSeconds() + 1;
    const endSecond = endDate.getSeconds();

    let startMinute = new Date(startDate);
    startMinute.setSeconds(0, 0);

    if (moment(startMinute).isDST() && !moment(startDate).isDST()) {
      startMinute = moment(startMinute).add(1, 'hours').toDate();
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      smin === emin &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getSimpleIndicesInAMinute(origin, startMinute, startSecond, endSecond, level, indices);
    } else {
      let endMinute = new Date(endDate);
      endMinute.setSeconds(0, 0);

      if (moment(endMinute).isDST() && !moment(endDate).isDST()) {
        endMinute = moment(endMinute).add(1, 'hours').toDate();
      }

      const length = moment(endMinute).diff(startMinute, 'minutes');

      getSimpleIndicesInAMinute(origin, startMinute, startSecond, 59, level, indices);

      for (let i = 1; i < length; i++) {
        const minute = moment(startMinute).add(i, 'minutes').toDate();
        getSimpleIndicesInAMinute(origin, minute, 1, 59, level, indices);
      }

      getSimpleIndicesInAMinute(origin, endMinute, 1, endSecond, level, indices);
    }
  }

  // In a second
  else if (level >= 0) {
    const sh = startDate.getHours();
    const eh = endDate.getHours();

    const smin = startDate.getMinutes();
    const emin = endDate.getMinutes();

    const ssec = startDate.getSeconds();
    const esec = endDate.getSeconds();

    const startMs = startDate.getMilliseconds();
    const endMs = endDate.getMilliseconds();

    let startSecond = new Date(startDate);
    startSecond.setMilliseconds(0);

    if (moment(startSecond).isDST() && !moment(startDate).isDST()) {
      startSecond = moment(startSecond).add(1, 'hours').toDate()
    }

    if (
      sy === ey &&
      sm === em &&
      sd === ed &&
      sh === eh &&
      smin === emin &&
      ssec === esec &&
      moment(startDate).isDST() === moment(endDate).isDST()
    ) {
      getSimpleIndicesInASecond(origin, startSecond, startMs, endMs, level, indices);
    } else {
      let endSecond = new Date(endDate);
      endSecond.setMilliseconds(0);

      if (moment(endSecond).isDST() && !moment(endDate).isDST()) {
        endSecond = moment(endSecond).add(1, 'hours').toDate()
      }

      let length = moment(endSecond).diff(startSecond, 'seconds');

      getSimpleIndicesInASecond(origin, startSecond, startMs, 999, level, indices);

      for (let i = 1; i < length; i++) {
        const second = moment(startSecond).add(i, 'seconds').toDate();
        getSimpleIndicesInASecond(origin, second, 1, 999, level, indices);
      }

      getSimpleIndicesInASecond(origin, endSecond, 1, endMs, level, indices);
    }
  }
}
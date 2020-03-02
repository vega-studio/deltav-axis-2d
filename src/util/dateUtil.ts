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

  const ll = lowerLevel && lowerLevel > 1 ? lowerLevel : 1

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

export function getMaxLevel(startDate: Date, endDate: Date) {
  const daysDiff = moment(endDate).diff(startDate, 'days');
  if (daysDiff < 365) return 7;
  const yearsDiff = moment(endDate).diff(startDate, 'years');
  let deltaLevel = Math.floor(Math.log2(yearsDiff));
  return 7 + deltaLevel;
}

function getLevel28(day: number) {
  if (day === 1) return 4;
  if (day === 15) return 3;
  if (day === 8 || day === 22) return 2;
  if (day === 4 || day === 11 || day === 18 || day === 25) return 1;
  return 0;
}

function getLevel29(day: number) {
  if (day === 1) return 4;
  if (day === 15) return 3;
  if (day === 8 || day === 22) return 2;
  if (day === 4 || day === 11 || day === 18 || day === 26) return 1;
  return 0;
}

function getLevel30(month: number, day: number) {
  if (day === 1) return getMonthLevel(month);
  if (day === 16) return 3;
  if (day === 8 || day === 23) return 2;
  if (day === 4 || day === 12 || day === 19 || day === 27) return 1;
  return 0;
}

function getLevel31(month: number, day: number) {
  if (day === 1) return getMonthLevel(month);
  if (day === 16) return 3;
  if (day === 8 || day === 24) return 2;
  if (day === 4 || day === 12 || day === 20 || day === 28) return 1;
  return 0;
}

function getMonthLevel(month: number) {
  if (month === 0) return 7;
  if (month === 6) return 6;
  if (month === 3 || month === 9) return 5;
  return 4;
}

function getLevel(year: number, month: number, day: number) {
  if (month === 1) {
    if (isLeapYear(year)) return getLevel29(day);
    else return getLevel28(day);
  }

  const days = monthDays[month];

  if (days === 30) return getLevel30(month, day);

  return getLevel31(month, day);
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
  const days = monthDays[month];
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
  const startDays = monthDays[startMonth];
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

    for (let y = startYear; y < endYear; y++) {
      travelYear(y, labels);
    }

    travelInAYear(endYear, 0, 1, endMonth, endDay, labels);
  } else if (startYear === endYear) {
    travelInAYear(startYear, startMonth, startDay, endMonth, endDay, labels);
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

  const lengths: number[] = [1, 3, 7];

  if ((has28 || has29) && !has30 && !has31) {
    lengths.push(14)
  } else {
    lengths.push(15);
  }

  if (has28) {
    lengths.push(28);
  } else if (has29) {
    lengths.push(29);
  } else if (has30) {
    lengths.push(30);
  } else {
    lengths.push(31);
  }

  if (has29 && !has28) {
    lengths.push(91);
    lengths.push(192);
    lengths.push(366);
  } else {
    lengths.push(90);
    lengths.push(191);
    lengths.push(365);
  }

  return lengths;
}
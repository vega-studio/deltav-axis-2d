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
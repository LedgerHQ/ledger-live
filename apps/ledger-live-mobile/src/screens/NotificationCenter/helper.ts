enum TypeOfTime {
  second = "second",
  minute = "minute",
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}
function getTime(timestampNew: number): [number, TypeOfTime] {
  const today = new Date().getTime();
  const fixedTimeStamp = new Date(timestampNew * 1000).getTime();
  const diff = Math.abs(today - fixedTimeStamp);

  const secs = Math.floor(Math.abs(diff) / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(weeks / 12);

  if (secs < 60) {
    return [secs, TypeOfTime.second];
  }

  if (mins < 60) {
    return [mins, TypeOfTime.minute];
  }

  if (hours < 24) {
    return [hours, TypeOfTime.hour];
  }

  if (days < 24) {
    return [days, TypeOfTime.day];
  }

  if (weeks < 4) {
    return [weeks, TypeOfTime.week];
  }

  if (months < 12) {
    return [months, TypeOfTime.month];
  }

  return [
    Math.abs(new Date(timestampNew).getFullYear() - new Date().getFullYear()),
    TypeOfTime.year,
  ];
}

export { getTime, TypeOfTime };

export function genDataNext(data, dateIncrement) {
  function mix(a, b, m) {
    return (1 - m) * a + m * b;
  }
  return {
    date: new Date(data[data.length - 1].date.getTime() + dateIncrement),
    value: mix(
      data[data.length - 1].value,
      Math.floor(6000000 * Math.random()),
      0.5
    )
  };
}

export function genData(n, dateIncrement) {
  const arr = [{ date: new Date(2018, 2, 1), value: 1234567 }];
  for (let i = 1; i < n; i++) {
    arr.push(genDataNext(arr, dateIncrement));
  }
  return arr;
}

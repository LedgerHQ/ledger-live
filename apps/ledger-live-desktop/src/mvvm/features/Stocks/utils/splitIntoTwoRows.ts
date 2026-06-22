/** Splits a list into two rows (even indices on top, odd on the bottom) for the column-scrolling grid. */
export function splitIntoTwoRows<T>(items: T[]): [T[], T[]] {
  const top: T[] = [];
  const bottom: T[] = [];
  items.forEach((item, index) => (index % 2 === 0 ? top : bottom).push(item));
  return [top, bottom];
}

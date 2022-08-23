// @flow
export default (a: ?Date, b: ?Date) =>
  Boolean(a === b || (a && b && a.getTime() === b.getTime()));

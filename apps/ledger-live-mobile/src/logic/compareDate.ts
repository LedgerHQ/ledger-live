export default (a: Date | null | undefined, b: Date | null | undefined) =>
  Boolean(a === b || (a && b && a.getTime() === b.getTime()));

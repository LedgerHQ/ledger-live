const getElement = <T extends string>(value: T | "undefined" | undefined): T | undefined =>
  value === "undefined" || value === undefined ? undefined : value;

const isOneOf = <T extends readonly string[]>(value: string, allowed: T): value is T[number] => {
  for (const item of allowed) {
    if (item === value) return true;
  }
  return false;
};

const makeOnValueChange =
  <T extends readonly string[]>(allowed: T, setter: (v: T[number]) => void) =>
  (value: string) => {
    if (isOneOf(value, allowed)) setter(value);
  };

export { getElement, isOneOf, makeOnValueChange };

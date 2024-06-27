export function parser(value: any, type: string) {
  if (type === "number") {
    return Number(value);
  } else if (type === "boolean") {
    return Boolean(value);
  } else {
    return value;
  }
}

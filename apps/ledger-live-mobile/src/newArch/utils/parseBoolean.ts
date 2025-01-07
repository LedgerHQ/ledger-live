export const parseBoolean = (value: string | boolean): boolean =>
  typeof value === "string" ? value === "true" : value;

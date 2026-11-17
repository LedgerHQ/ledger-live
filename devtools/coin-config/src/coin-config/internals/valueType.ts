import type { ValueType } from "../../types";

export function valueTypeOf(value: unknown): ValueType {
  if (value === undefined) return "unset";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean" ? type : "object";
}

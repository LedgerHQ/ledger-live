import { z } from "zod";

/** Parses `value` as the dev value of `name`: `undefined` when valid, why not otherwise. */
export function validateValue(
  valueSchemas: z.ZodRawShape,
  name: string,
  value: unknown,
): string | undefined {
  if (!Object.hasOwn(valueSchemas, name)) return `"${name}" is not a config value`;
  if (typeof value !== "string") return "A dev value must be a string";
  const result = z.safeParse(valueSchemas[name], value);
  return result.success ? undefined : result.error.issues.map(({ message }) => message).join("; ");
}

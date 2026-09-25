/** Shared across every service's `*ApiExtraSchema`: a function-typed field in `extraArgument`
 * (a getter re-read on every request, rather than a value baked in at store creation). */
export const isFunction = (value: unknown): boolean => typeof value === "function";

export const mustBeAFunction = (name: string): { message: string } => ({
  message: `${name} must be a function`,
});

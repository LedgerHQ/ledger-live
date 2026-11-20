// Private to the package: no barrel re-exports this file.
export type AppJsonFile = { data?: Record<string, unknown>; [field: string]: unknown };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** An object, with a `data` object when it has one. */
export const isAppJsonFile = (value: unknown): value is AppJsonFile =>
  isObject(value) && (value.data === undefined || isObject(value.data));

export const isMissingFileError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

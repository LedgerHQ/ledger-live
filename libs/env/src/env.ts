// set and get environment & config variables
import { configured, changes, injectDefinitions } from "./state";
export type { EnvDef, EnvDefs } from "./state";
export { injectDefinitions, changes };

const intParser = (v: any): number | undefined => {
  if (!Number.isNaN(v)) return parseInt(v, 10);
};

const floatParser = (v: any): number | undefined => {
  if (!Number.isNaN(v)) return parseFloat(v);
};

const boolParser = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

const stringParser = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

const jsonParser = (v: unknown): JSONValue | undefined => {
  try {
    if (typeof v !== "string") throw new Error();
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

const stringArrayParser = (v: unknown): string[] | undefined => {
  const v_array = typeof v === "string" ? v.split(",") : null;
  if (Array.isArray(v_array) && v_array.length > 0) return v_array;
};

export { intParser, floatParser, boolParser, stringParser, jsonParser, stringArrayParser };

// Backward-compat type aliases — type-lossy once definitions are externalized.
export type EnvName = string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type EnvValue<_K extends string = string> = unknown;

export const getDefinition = (name: string) => configured().definitions[name];

export const getAllEnvNames = (): string[] => Object.keys(configured().definitions);

export const getAllEnvs = (): Record<string, unknown> => ({ ...configured().env });

// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = (name: string): unknown => configured().env[name];

export const getEnvDefault = (name: string): unknown => configured().defaults[name];

export const isEnvDefault = (name: string): boolean => {
  const { env, defaults } = configured();
  return env[name] === defaults[name];
};

export const getEnvDesc = (name: string): string => configured().definitions[name]?.desc ?? "";

// change one environment
export const setEnv = (name: string, value: unknown): void => {
  const { env } = configured();
  const oldValue = env[name];
  if (oldValue !== value) {
    env[name] = value;
    changes.next({ name, value, oldValue });
  }
};

// change one environment with safety. returns true if it succeed
export const setEnvUnsafe = (name: string, unsafeValue: unknown): boolean => {
  const def = getDefinition(name);
  if (!def) return false;
  const value = def.parser(unsafeValue);
  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }
  setEnv(name, value);
  return true;
};

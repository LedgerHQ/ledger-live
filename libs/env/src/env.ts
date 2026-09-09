// set and get environment & config variables
export { injectDefinitions, changes } from "./state";
export type { EnvDef, EnvDefs, EnvChange } from "./state";
import { configured, notifyChange } from "./state";
import type { EnvDef as EnvDefRecord } from "./state";

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const intParser = (v: any): number | undefined => {
  const n = Number.parseInt(v, 10);
  if (!Number.isNaN(n)) return n;
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const floatParser = (v: any): number | undefined => {
  const n = Number.parseFloat(v);
  if (!Number.isNaN(n)) return n;
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const boolParser = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  return !(v === "0" || v === "false");
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const stringParser = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const jsonParser = (v: unknown): JSONValue | undefined => {
  try {
    if (typeof v !== "string") throw new Error();
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and these parsers go with it. Parse and
 * default explicitly at the point of use instead — see MIGRATION.md.
 */
export const stringArrayParser = (v: unknown): string[] | undefined => {
  const v_array = typeof v === "string" ? v.split(",") : null;
  if (Array.isArray(v_array) && v_array.length > 0) return v_array;
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and the registry it introspects goes with
 * it — see MIGRATION.md.
 */
export const getDefinition = (name: string): EnvDefRecord<unknown> | undefined =>
  configured().definitions[name] as EnvDefRecord<unknown> | undefined;

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and the registry it introspects goes with
 * it — see MIGRATION.md.
 */
export const getAllEnvNames = (): string[] => Object.keys(configured().definitions);

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. See MIGRATION.md.
 */
export const getAllEnvs = (): Record<string, unknown> => ({ ...configured().env });

// `any`, not `unknown`: the framework knows no value type, and callers expect a usable value.
/**
 * @deprecated `@ledgerhq/live-env` is being sunset. Replace this read with a feature flag,
 * an inline constant, `process.env` at the point of use, or a value the caller passes in —
 * see MIGRATION.md.
 */
export function getEnv(name: string): any {
  return configured(name).env[name];
}

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. See MIGRATION.md.
 */
export function getEnvDefault(name: string): any {
  return configured(name).defaults[name];
}

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and the registry it introspects goes with
 * it — see MIGRATION.md.
 */
export const isEnvDefault = (name: string): boolean => {
  const { env: e, defaults: d } = configured();
  return e[name] === d[name];
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset, and the registry it introspects goes with
 * it — see MIGRATION.md.
 */
export const getEnvDesc = (name: string): string =>
  (configured().definitions as Record<string, { desc: string }>)[name]?.desc ?? "";

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. A value that has to change at runtime
 * belongs in a feature flag or in the app's own state, not in a global mutable singleton —
 * see MIGRATION.md.
 */
export function setEnv(name: string, value: unknown): void {
  const state = configured();
  const oldValue = state.env[name];
  if (oldValue !== value) {
    state.env[name] = value;
    notifyChange({ name, value, oldValue });
  }
}

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. Read and parse the raw value where you
 * use it instead — see MIGRATION.md.
 */
export const setEnvUnsafe = (name: string, unsafeValue: unknown): boolean => {
  const definition = getDefinition(name);
  if (!definition) return false;
  const { parser } = definition;
  const value = parser(unsafeValue);

  if (value === undefined || value === null) {
    console.warn(`Invalid ENV value for ${name}`);
    return false;
  }

  setEnv(name, value);
  return true;
};

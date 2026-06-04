import { Provider } from "./providers";
import merge from "lodash/merge";

/**
 * Narrows `value` to a plain object literal (`{...}`) or `Object.create(null)`.
 * Built-ins like `Date` / `Map` / class instances are rejected because their
 * own enumerable properties would surface in deep-merge results — never the
 * user's intent. Shared with the desktop sanitizer so persisted JSON and
 * runtime overrides apply the same definition of "plain object".
 */
export const isPlainObjectOverride = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Keys that would let an attacker reach `Object.prototype` via assignment
 * (e.g. `obj.__proto__ = ...`) or constructor lookup. Persisted overrides are
 * read from disk, so we treat the payload as untrusted and refuse these keys
 * at every entry point.
 */
export const UNSAFE_OVERRIDE_KEYS: ReadonlySet<string> = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/**
 * Returns a fresh shallow copy of `input` with prototype-pollution keys and
 * `undefined` values stripped. Shared by every write boundary that ingests
 * override-shaped payloads (LiveConfig setters, the desktop Redux slice,
 * persisted-state hydration).
 */
export const cloneOverridesSafely = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (UNSAFE_OVERRIDE_KEYS.has(key)) continue;
    const value = input[key];
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
};

type ValidConfigTypes = {
  string: string;
  boolean: boolean;
  number: number;
  object: Record<string, unknown>;
  array: unknown[];
};

type ConfigInfoShape<Type extends keyof ValidConfigTypes> = {
  type: Type;
  default: ValidConfigTypes[Type];
};

export type ConfigInfo =
  | ConfigInfoShape<"string">
  | ConfigInfoShape<"boolean">
  | ConfigInfoShape<"number">
  | ConfigInfoShape<"object">
  | ConfigInfoShape<"array">;

export type ConfigSchema = Record<string, ConfigInfo>;

export class LiveConfig {
  public provider?: Provider;
  public config: ConfigSchema = {};
  public overrides: Record<string, unknown> = {};
  public appVersion?: string;
  public platform?: string;
  public environment?: string;
  public static instance: LiveConfig = new LiveConfig();

  private constructor() {}

  static setAppinfo(params: { appVersion?: string; platform?: string; environment?: string }) {
    LiveConfig.instance.appVersion = params.appVersion;
    LiveConfig.instance.platform = params.platform;
    LiveConfig.instance.environment = params.environment;
  }

  static setProvider(provider: Provider) {
    LiveConfig.instance.provider = provider;
  }

  static setConfig(config: ConfigSchema) {
    LiveConfig.instance.config = config;
  }

  static isConfigSet() {
    return Object.keys(LiveConfig.instance.config).length > 0;
  }

  static setOverride(key: string, value: unknown) {
    if (UNSAFE_OVERRIDE_KEYS.has(key)) return;
    if (value === undefined) {
      delete LiveConfig.instance.overrides[key];
    } else {
      LiveConfig.instance.overrides[key] = value;
    }
  }

  static setAllOverrides(overrides: Record<string, unknown>) {
    LiveConfig.instance.overrides = cloneOverridesSafely(overrides);
  }

  static getOverrides(): Record<string, unknown> {
    return { ...LiveConfig.instance.overrides };
  }

  static getValueByKey(key: string) {
    if (Object.keys(LiveConfig.instance.config).length === 0) {
      throw new Error("Config not set");
    }

    // Not `Object.hasOwn` because this package's tsconfig lib is es2020.
    const hasOverride = Object.prototype.hasOwnProperty.call(LiveConfig.instance.overrides, key);
    const overrideValue = LiveConfig.instance.overrides[key];
    const defaultValue = LiveConfig.instance.config[key]?.default;
    const isObjectKey = LiveConfig.instance.config[key]?.type === "object";

    if (!LiveConfig.instance.provider) {
      if (hasOverride) {
        // Only deep-merge object-typed configs when the override is itself a plain object;
        // a non-object override (null, primitive, array) must win as-is, otherwise
        // lodash `merge` silently ignores it and the override never applies.
        return isObjectKey && isPlainObjectOverride(overrideValue)
          ? merge({}, defaultValue, overrideValue)
          : overrideValue;
      }
      // return default value if no provider is set
      return defaultValue;
    }

    const providerValue =
      LiveConfig.instance.provider.getValueByKey(key, LiveConfig.instance.config[key]) ??
      defaultValue;

    if (isObjectKey) {
      // we spread the default values first and then the values from the provider
      // this is for backward compatiblity, a value could be renamed or deleted in a remote provider
      // but the default value will not change for a given version of Ledger Live
      // so we make sure that there's always a fallback in a case the value changed remotely
      const merged = merge({}, defaultValue, providerValue);
      if (!hasOverride) return merged;
      // Same rule as the no-provider path: only deep-merge when the override is a
      // plain object so non-object overrides take precedence as-is.
      return isPlainObjectOverride(overrideValue) ? merge(merged, overrideValue) : overrideValue;
    }

    return hasOverride ? overrideValue : providerValue;
  }

  static getDefaultValueByKey(key: string) {
    if (Object.keys(LiveConfig.instance.config).length === 0) {
      throw new Error("Config not set");
    }
    return LiveConfig.instance.config[key]?.default;
  }
}

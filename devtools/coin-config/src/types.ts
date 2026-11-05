export interface CoinConfigToolProps {
  /** Every LiveConfig key, sorted. */
  keys: readonly string[];
  /** The local overrides, by key. */
  overrides: Readonly<Record<string, unknown>>;
  /** What LiveConfig resolves for a key, its override included. */
  getResolvedValue: (key: string) => unknown;
  /** The value the LiveConfig schema declares for a key. */
  getDefaultValue: (key: string) => unknown;
  setOverride: (key: string, value: unknown) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
}

export type KeyFilter = "coins" | "all" | "overridden";

export type ValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "unset";

export interface KeyDisplayState {
  key: string;
  resolved: unknown;
  defaultValue: unknown;
  valueType: ValueType;
  isOverridden: boolean;
}

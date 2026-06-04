import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  UNSAFE_OVERRIDE_KEYS,
  cloneOverridesSafely,
  isPlainObjectOverride,
} from "@ledgerhq/live-config/LiveConfig";

type StateWithCoinConfigOverrides = { coinConfigOverrides: CoinConfigOverridesState };

export type CoinConfigOverridesState = {
  overrides: Record<string, unknown>;
};

const initialState: CoinConfigOverridesState = {
  overrides: {},
};

const coinConfigOverridesSlice = createSlice({
  name: "coinConfigOverrides",
  initialState,
  reducers: {
    setCoinConfigOverride(
      state,
      action: PayloadAction<{ key: string; value: unknown }>,
    ) {
      const { key, value } = action.payload;
      if (UNSAFE_OVERRIDE_KEYS.has(key)) return;
      if (value === undefined) {
        delete state.overrides[key];
      } else {
        state.overrides[key] = value;
      }
    },
    setAllCoinConfigOverrides(state, action: PayloadAction<Record<string, unknown>>) {
      state.overrides = cloneOverridesSafely(action.payload);
    },
  },
});

export const { setCoinConfigOverride, setAllCoinConfigOverrides } =
  coinConfigOverridesSlice.actions;

export const coinConfigOverridesSelector = (state: StateWithCoinConfigOverrides) =>
  state.coinConfigOverrides.overrides;

export const hasCoinConfigOverridesSelector = (state: StateWithCoinConfigOverrides) =>
  Object.keys(state.coinConfigOverrides.overrides).length > 0;

/**
 * Validates a raw `overrides` payload read from disk. Returns a fresh map of
 * own enumerable string-keyed entries, or `null` if the payload isn't a
 * plain object literal (or `Object.create(null)`). Guards against corrupted
 * JSON (arrays, primitives, null), non-plain objects (Date, class instances,
 * Map, etc.), prototype-pollution keys (`__proto__` / `constructor` /
 * `prototype`), and `undefined` values so we never feed garbage to LiveConfig.
 */
export const sanitizePersistedOverrides = (
  raw: unknown,
): Record<string, unknown> | null =>
  isPlainObjectOverride(raw) ? cloneOverridesSafely(raw) : null;

export default coinConfigOverridesSlice.reducer;

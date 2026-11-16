import { useState, type ComponentType } from "react";
import type { CoinConfigToolProps } from "../types";

export const SOLANA_KEY = "config_currency_solana";
export const ETH_KEY = "config_currency_ethereum";
export const COUNTERVALUES_KEY = "config_countervalues_refreshRate";

const defaults: Record<string, unknown> = {
  [COUNTERVALUES_KEY]: 60000,
  [ETH_KEY]: { status: "active" },
  [SOLANA_KEY]: { token2022Enabled: false },
};

/** A host holding the overrides in state, like the store does, with spies on each action. */
export function createTestHost(Tool: ComponentType<CoinConfigToolProps>) {
  const spies = {
    setOverride: jest.fn(),
    clearOverride: jest.fn(),
    clearAllOverrides: jest.fn(),
  };

  function Host({
    initialOverrides = {},
  }: Readonly<{ initialOverrides?: Record<string, unknown> }>) {
    const [overrides, setOverrides] = useState(initialOverrides);
    return (
      <Tool
        keys={Object.keys(defaults).sort((a, b) => a.localeCompare(b))}
        overrides={overrides}
        getResolvedValue={key => (Object.hasOwn(overrides, key) ? overrides[key] : defaults[key])}
        getDefaultValue={key => defaults[key]}
        setOverride={(key, value) => {
          spies.setOverride(key, value);
          setOverrides(current => ({ ...current, [key]: value }));
        }}
        clearOverride={key => {
          spies.clearOverride(key);
          setOverrides(({ [key]: _removed, ...rest }) => rest);
        }}
        clearAllOverrides={() => {
          spies.clearAllOverrides();
          setOverrides({});
        }}
      />
    );
  }

  return { Host, spies };
}

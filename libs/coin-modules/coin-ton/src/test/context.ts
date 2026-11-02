import type { TonConfig, TonContext } from "../config";

export const TON_API_MOCKED = "https://ton.mocked/api/v3";

/** Shaped like the shipped `config_currency_ton` default, which names the currency "Gram". */
export const mockTonConfig: TonConfig = {
  status: { type: "active" },
  name: "Gram",
  unit: { name: "GRAM", code: "GRAM", magnitude: 9 },
  infra: { API_TON_ENDPOINT: TON_API_MOCKED, KNOWN_JETTONS: [] },
};

export const createMockTonContext = (config: TonConfig = mockTonConfig): TonContext => ({
  config: () => Promise.resolve(config),
  logger: () => {},
});

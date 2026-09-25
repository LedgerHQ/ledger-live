import type { AptosCoinConfig, AptosContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockAptosConfigFull: AptosCoinConfig = {
  status: { type: "active" },
  name: "Aptos",
  unit: { name: "APT", code: "APT", magnitude: 8 },
  aptosSettings: {},
};

/** An {@link AptosContext} backed by the mocked config, for api tests. */
export const createMockAptosContext = (
  config: AptosCoinConfig = mockAptosConfigFull,
): AptosContext => ({
  config: async () => config,
  logger: () => {},
});

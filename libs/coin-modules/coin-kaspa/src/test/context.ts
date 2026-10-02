import type { KaspaCoinConfig, KaspaContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockKaspaConfig: KaspaCoinConfig = {
  status: { type: "active" },
  name: "KASPA",
  unit: { name: "KAS", code: "KAS", magnitude: 8 },
};

/** A {@link KaspaContext} backed by the mocked config, for api tests. */
export const createMockKaspaContext = (
  config: KaspaCoinConfig = mockKaspaConfig,
): KaspaContext => ({
  config: async () => config,
  logger: () => {},
});

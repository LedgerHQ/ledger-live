import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("getBlock", () => {
  it("throws an unsupported error", () => {
    const api = createApi("cardano");

    expect(() => api.getBlock(mockCtx, 0)).toThrow("getBlock is not supported");
  });
});

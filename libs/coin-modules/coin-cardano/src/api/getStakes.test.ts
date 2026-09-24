import type { Context } from "@ledgerhq/coin-module-framework/config";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { infraByCurrency } from "../test/coinConfig";
import { getStakes } from "../logic/getStakes";
import { createApi } from ".";

jest.mock("../logic/getStakes", () => ({
  getStakes: jest.fn(),
}));

const mockGetStakes = jest.mocked(getStakes);

const config: CardanoConfig = {
  maxFeesWarning: 0,
  maxFeesError: 0,
  infra: infraByCurrency.cardano,
};
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("api.getStakes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the getStakes logic with the resolved currency, address and cursor", async () => {
    const page = { items: [] };
    mockGetStakes.mockResolvedValue(page);
    const api = createApi("cardano");

    const result = await api.getStakes(mockCtx, "addr", { cursor: "cursor" });

    expect(mockGetStakes).toHaveBeenCalledTimes(1);
    expect(mockGetStakes).toHaveBeenCalledWith(
      expect.objectContaining({ infra: expect.any(Object) }),
      "addr",
      "cursor",
    );
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getStakes logic", async () => {
    mockGetStakes.mockRejectedValue(new Error("delegation fetch failed"));
    const api = createApi("cardano");

    await expect(api.getStakes(mockCtx, "addr")).rejects.toThrow("delegation fetch failed");
  });
});

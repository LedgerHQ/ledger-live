import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { CardanoCoinConfig } from "../config";
import { cardanoCoinConfig } from "../fixtures/config";
import { getStakes } from "../logic/getStakes";
import { createApi } from ".";

jest.mock("../logic/getStakes", () => ({
  getStakes: jest.fn(),
}));

const mockGetStakes = jest.mocked(getStakes);

const config = cardanoCoinConfig;
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => config,
  logger: () => {},
};

describe("api.getStakes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the getStakes logic with the resolved config, address and cursor", async () => {
    const page = { items: [] };
    mockGetStakes.mockResolvedValue(page);
    const api = createApi("cardano");

    const result = await api.getStakes(mockCtx, "addr", { cursor: "cursor" });

    expect(mockGetStakes).toHaveBeenCalledTimes(1);
    expect(mockGetStakes).toHaveBeenCalledWith(config, "addr", "cursor");
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getStakes logic", async () => {
    mockGetStakes.mockRejectedValue(new Error("delegation fetch failed"));
    const api = createApi("cardano");

    await expect(api.getStakes(mockCtx, "addr")).rejects.toThrow("delegation fetch failed");
  });
});

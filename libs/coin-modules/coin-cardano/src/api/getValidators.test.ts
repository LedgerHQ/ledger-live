import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { CardanoCoinConfig } from "../config";
import { cardanoCoinConfig } from "../fixtures/config";
import { getValidators } from "../logic/getValidators";
import { createApi } from ".";

jest.mock("../logic/getValidators", () => ({
  getValidators: jest.fn(),
}));

const mockGetValidators = jest.mocked(getValidators);

const config = cardanoCoinConfig;
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => config,
  logger: () => {},
};

describe("api.getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the getValidators logic with the resolved config", async () => {
    const page = { items: [], next: undefined };
    mockGetValidators.mockResolvedValue(page);
    const api = createApi("cardano");

    const result = await api.getValidators(mockCtx);

    expect(mockGetValidators).toHaveBeenCalledTimes(1);
    expect(mockGetValidators).toHaveBeenCalledWith(config);
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getValidators logic", async () => {
    mockGetValidators.mockRejectedValue(new Error("pool list fetch failed"));
    const api = createApi("cardano");

    await expect(api.getValidators(mockCtx)).rejects.toThrow("pool list fetch failed");
  });
});

import type { Context } from "@ledgerhq/coin-module-framework/config";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { infraByCurrency } from "../test/coinConfig";
import { getValidators } from "../logic/getValidators";
import { createApi } from ".";

jest.mock("../logic/getValidators", () => ({
  getValidators: jest.fn(),
}));

const mockGetValidators = jest.mocked(getValidators);

const config: CardanoConfig = {
  maxFeesWarning: 0,
  maxFeesError: 0,
  infra: infraByCurrency.cardano,
};
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("api.getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the getValidators logic with the resolved currency", async () => {
    const page = { items: [], next: undefined };
    mockGetValidators.mockResolvedValue(page);
    const api = createApi("cardano");

    const result = await api.getValidators(mockCtx);

    expect(mockGetValidators).toHaveBeenCalledTimes(1);
    expect(mockGetValidators).toHaveBeenCalledWith(
      expect.objectContaining({ infra: expect.any(Object) }),
    );
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getValidators logic", async () => {
    mockGetValidators.mockRejectedValue(new Error("pool list fetch failed"));
    const api = createApi("cardano");

    await expect(api.getValidators(mockCtx)).rejects.toThrow("pool list fetch failed");
  });
});

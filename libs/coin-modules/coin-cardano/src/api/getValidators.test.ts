import type { Context } from "@ledgerhq/coin-module-framework/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { getValidators } from "../logic/getValidators";
import { createApi } from ".";

jest.mock("../logic/getValidators", () => ({
  getValidators: jest.fn(),
}));

const mockGetValidators = jest.mocked(getValidators);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const currency = getCryptoCurrencyById("cardano");
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
    expect(mockGetValidators).toHaveBeenCalledWith(currency);
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getValidators logic", async () => {
    mockGetValidators.mockRejectedValue(new Error("pool list fetch failed"));
    const api = createApi("cardano");

    await expect(api.getValidators(mockCtx)).rejects.toThrow("pool list fetch failed");
  });
});

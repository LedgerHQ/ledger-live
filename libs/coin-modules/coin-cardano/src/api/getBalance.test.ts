import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { getBalance } from "../logic/getBalance";

jest.mock("../logic/getBalance");
const mockGetBalance = jest.mocked(getBalance);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("getBalance", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to logic getBalance with the resolved currency and address", async () => {
    const balances = [{ value: 1n, asset: { type: "native" as const } }];
    mockGetBalance.mockResolvedValue(balances);

    const api = createApi("cardano");
    const result = await api.getBalance(mockCtx, "addr1xxx");

    expect(result).toBe(balances);
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(mockGetBalance.mock.calls[0][0].id).toBe("cardano");
    expect(mockGetBalance.mock.calls[0][1]).toBe("addr1xxx");
  });

  it("propagates errors from logic getBalance", async () => {
    mockGetBalance.mockRejectedValue(new Error("boom"));

    const api = createApi("cardano");

    await expect(api.getBalance(mockCtx, "addr1xxx")).rejects.toThrow("boom");
  });

  it("rejects unsupported balance options instead of silently dropping them", async () => {
    const api = createApi("cardano");

    await expect(api.getBalance(mockCtx, "addr1xxx", {} as never)).rejects.toThrow(
      "getBalance does not support the options parameter",
    );
    expect(mockGetBalance).not.toHaveBeenCalled();
  });
});

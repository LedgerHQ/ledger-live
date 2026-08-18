import type { TransactionIntent, StringMemo } from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { estimateFees } from "../logic/estimateFees";

jest.mock("../logic/estimateFees");
const mockEstimateFees = jest.mocked(estimateFees);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

const intent = {
  intentType: "transaction",
  type: "send",
  sender: "addr1sender",
  recipient: "addr1recipient",
  amount: 1_000_000n,
  asset: { type: "native" },
} as TransactionIntent<StringMemo>;

describe("estimateFees", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to logic estimateFees with the resolved currency and intent", async () => {
    const estimation = { value: 170_000n };
    mockEstimateFees.mockResolvedValue(estimation);

    const api = createApi("cardano");
    const result = await api.estimateFees(mockCtx, intent);

    expect(result).toBe(estimation);
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockEstimateFees.mock.calls[0][0].id).toBe("cardano");
    expect(mockEstimateFees.mock.calls[0][1]).toBe(intent);
  });

  it("accepts but ignores customFeesParameters (no fee market on Cardano)", async () => {
    const estimation = { value: 170_000n };
    mockEstimateFees.mockResolvedValue(estimation);

    const api = createApi("cardano");
    const result = await api.estimateFees(mockCtx, intent, { feeOption: undefined });

    expect(result).toBe(estimation);
    // The second positional arg (customFeesParameters) is not forwarded to the logic layer.
    expect(mockEstimateFees.mock.calls[0]).toHaveLength(2);
    expect(mockEstimateFees.mock.calls[0][1]).toBe(intent);
  });

  it("propagates errors from logic estimateFees", async () => {
    mockEstimateFees.mockRejectedValue(new Error("boom"));

    const api = createApi("cardano");

    await expect(api.estimateFees(mockCtx, intent)).rejects.toThrow("boom");
  });
});

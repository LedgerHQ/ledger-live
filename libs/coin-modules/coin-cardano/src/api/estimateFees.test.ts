import type { TransactionIntent, StringMemo } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import { type CardanoConfig } from "../config";
import { estimateFees } from "../logic/estimateFees";

jest.mock("../logic/estimateFees");
const mockEstimateFees = jest.mocked(estimateFees);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

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

    const api = createApi(config, "cardano");
    const result = await api.estimateFees(intent);

    expect(result).toBe(estimation);
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockEstimateFees.mock.calls[0][0].id).toBe("cardano");
    expect(mockEstimateFees.mock.calls[0][1]).toBe(intent);
  });

  it("accepts but ignores customFeesParameters (no fee market on Cardano)", async () => {
    const estimation = { value: 170_000n };
    mockEstimateFees.mockResolvedValue(estimation);

    const api = createApi(config, "cardano");
    const result = await api.estimateFees(intent, { priority: "high" });

    expect(result).toBe(estimation);
    // The second positional arg (customFeesParameters) is not forwarded to the logic layer.
    expect(mockEstimateFees.mock.calls[0]).toHaveLength(2);
    expect(mockEstimateFees.mock.calls[0][1]).toBe(intent);
  });

  it("propagates errors from logic estimateFees", async () => {
    mockEstimateFees.mockRejectedValue(new Error("boom"));

    const api = createApi(config, "cardano");

    await expect(api.estimateFees(intent)).rejects.toThrow("boom");
  });
});

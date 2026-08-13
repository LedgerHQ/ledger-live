import type {
  FeeEstimation,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { craftTransaction } from "../logic/craftTransaction";

jest.mock("../logic/craftTransaction");
const mockCraftTransaction = jest.mocked(craftTransaction);

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

describe("craftTransaction", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to logic craftTransaction with the resolved currency, intent and custom fees", async () => {
    const crafted = { transaction: "deadbeef", details: { fees: "170000" } };
    mockCraftTransaction.mockResolvedValue(crafted);
    const customFees: FeeEstimation = { value: 200_000n };

    const api = createApi("cardano");
    const result = await api.craftTransaction(mockCtx, intent, { customFees });

    expect(result).toBe(crafted);
    expect(mockCraftTransaction).toHaveBeenCalledTimes(1);
    expect(mockCraftTransaction.mock.calls[0][0].id).toBe("cardano");
    expect(mockCraftTransaction.mock.calls[0][1]).toBe(intent);
    expect(mockCraftTransaction.mock.calls[0][2]).toBe(customFees);
  });

  it("propagates errors from logic craftTransaction", async () => {
    mockCraftTransaction.mockRejectedValue(new Error("boom"));

    const api = createApi("cardano");

    await expect(api.craftTransaction(mockCtx, intent)).rejects.toThrow("boom");
  });
});

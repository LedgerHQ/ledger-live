import type { Account } from "@ledgerhq/types-live";
import { REPLACE_SPEEDUP } from "@ledgerhq/coin-bitcoin/api";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getReplacementEstimate } from "./replacement";

jest.mock("../../../bridge/generic-coin-framework/api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../../../bridge/generic-coin-framework/api/context", () => ({
  buildContext: jest.fn(),
}));

const mockedGetCoinModuleApi = getCoinModuleApi as jest.Mock;
const mockedBuildContext = buildContext as jest.Mock;

const estimateFees = jest.fn();
const context = { config: jest.fn(), logger: jest.fn() };

const account = (
  derivationMode: string,
  currencyId = "bitcoin",
  {
    operations = [],
    pendingOperations = [],
  }: Partial<Pick<Account, "operations" | "pendingOperations">> = {},
): Account =>
  ({
    currency: { id: currencyId },
    derivationMode,
    freshAddress: "bc1qfresh",
    operations,
    pendingOperations,
  }) as unknown as Account;

describe("getReplacementEstimate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCoinModuleApi.mockResolvedValue({ estimateFees });
    mockedBuildContext.mockReturnValue(context);
  });

  it("asks the local coin module for a replacement estimation of the transaction", async () => {
    const parameters = {
      feeRates: { slow: 1n, medium: 2n, fast: 3n },
      minReplacementFee: 1200n,
      originalFee: 1000n,
      originalFeePerByte: 10n,
    };
    estimateFees.mockResolvedValue({ value: 1200n, parameters });

    const result = await getReplacementEstimate(account("native_segwit"), "orig-txid");

    expect(mockedGetCoinModuleApi).toHaveBeenCalledWith("bitcoin", "local");
    expect(mockedBuildContext).toHaveBeenCalledWith("bitcoin");
    expect(estimateFees).toHaveBeenCalledWith(
      context,
      {
        intentType: "transaction",
        type: REPLACE_SPEEDUP,
        sender: "bc1qfresh",
        recipient: "",
        amount: 0n,
        asset: { type: "native" },
        data: {
          type: "bitcoin",
          derivationMode: "Native SegWit",
          replacement: { txid: "orig-txid" },
        },
      },
      { customFeesParameters: { feesStrategy: "fast" } },
    );
    expect(result).toBe(parameters);
  });

  it.each([
    ["", "Legacy"],
    ["segwit", "SegWit"],
    ["taproot", "Taproot"],
  ])("passes the wallet derivation mode of a %p account", async (mode, expected) => {
    estimateFees.mockResolvedValue({ value: 0n, parameters: {} });

    await getReplacementEstimate(account(mode, "litecoin"), "orig-txid");

    expect(mockedGetCoinModuleApi).toHaveBeenCalledWith("litecoin", "local");
    expect(estimateFees.mock.calls[0][1].data.derivationMode).toBe(expected);
  });

  it("counts the other pending transactions of the account spending the same inputs", async () => {
    const replaced = {
      replacedInputs: [{ txid: "funding", vout: 1, value: 5000n, address: "bc1qme" }],
    };
    const withConflicts = { ...replaced, minReplacementFee: 3000n };
    estimateFees
      .mockResolvedValueOnce({ value: 0n, parameters: replaced })
      .mockResolvedValueOnce({ value: 0n, parameters: withConflicts });
    const pending = (hash: string, inputs: string[], blockHeight: number | null = null) =>
      ({ hash, blockHeight, extra: { inputs } }) as never;

    const result = await getReplacementEstimate(
      account("native_segwit", "bitcoin", {
        pendingOperations: [
          pending("first-send", ["funding-1"]),
          pending("orig-txid", ["funding-1"]),
        ],
        operations: [pending("unrelated", ["other-0"]), pending("confirmed", ["funding-1"], 100)],
      }),
      "orig-txid",
    );

    expect(estimateFees).toHaveBeenCalledTimes(2);
    expect(estimateFees.mock.calls[1][1].data.replacement).toEqual({
      txid: "orig-txid",
      conflictingTxIds: ["first-send"],
    });
    expect(result).toBe(withConflicts);
  });

  it("returns empty parameters when the estimation has none", async () => {
    estimateFees.mockResolvedValue({ value: 0n });

    await expect(getReplacementEstimate(account("native_segwit"), "orig-txid")).resolves.toEqual(
      {},
    );
  });

  it("propagates a failed estimation (e.g. a transaction that is not replaceable)", async () => {
    estimateFees.mockRejectedValue(new Error("Transaction is not RBF-enabled"));

    await expect(getReplacementEstimate(account("native_segwit"), "orig-txid")).rejects.toThrow(
      "Transaction is not RBF-enabled",
    );
  });
});

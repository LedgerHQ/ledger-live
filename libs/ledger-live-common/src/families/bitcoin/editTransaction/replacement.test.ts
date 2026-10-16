import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { emptyState, versioned } from "@ledgerhq/account-module-utxo";
import { REPLACE_SPEEDUP } from "@ledgerhq/coin-bitcoin/api";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { mockLiveConfig } from "../../../bridge/generic-coin-framework/tests/portfolioFixtures";
import { fromJsonFeeParameters, getReplacementEstimate } from "./replacement";

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
      ({
        hash,
        type: "OUT",
        value: new BigNumber(1),
        fee: new BigNumber(0),
        senders: [],
        recipients: [],
        date: new Date(),
        blockHeight,
        extra: { inputs },
      }) as never;

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

describe("fromJsonFeeParameters", () => {
  it("revives the amounts, fee rates and values of the JSON form as bigints", () => {
    expect(
      fromJsonFeeParameters({
        feePerByte: "12",
        feeRates: { slow: "1", medium: "2", fast: "3" },
        relayFeePerByte: "1",
        inputs: [{ txid: "a", vout: 0, value: "5000", address: "bc1qme" }],
        outputs: [{ address: null, value: "4000", isChange: true }],
        amount: "4000",
        minReplacementFee: "3000",
        originalFeePerByte: "10",
        originalFee: "1000",
        minReplacementFeePerByte: "12",
        replacedInputs: [{ txid: "funding", vout: 1, value: "5000", address: null }],
        replacedOutputs: [{ address: "bc1qthem", value: 4000 }],
      }),
    ).toEqual({
      feePerByte: 12n,
      feeRates: { slow: 1n, medium: 2n, fast: 3n },
      relayFeePerByte: 1n,
      inputs: [{ txid: "a", vout: 0, value: 5000n, address: "bc1qme" }],
      outputs: [{ address: null, value: 4000n, isChange: true }],
      amount: 4000n,
      minReplacementFee: 3000n,
      originalFeePerByte: 10n,
      originalFee: 1000n,
      minReplacementFeePerByte: 12n,
      replacedInputs: [{ txid: "funding", vout: 1, value: 5000n, address: null }],
      replacedOutputs: [{ address: "bc1qthem", value: 4000n }],
    });
  });

  it("keeps what is not an amount as it is, and reads nothing from a non-object", () => {
    expect(fromJsonFeeParameters({ originalFee: null, outputs: ["odd"], other: "1" })).toEqual({
      originalFee: null,
      outputs: ["odd"],
      other: "1",
    });
    expect(fromJsonFeeParameters(undefined)).toEqual({});
    expect(fromJsonFeeParameters(["1"])).toEqual({});
  });
});

describe("getReplacementEstimate through the portfolio layer", () => {
  const XPUB = "xpub6Fake";
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const operation = (hash: string, inputs: string[]) =>
    ({
      id: `${hash}-OUT`,
      hash,
      type: "OUT",
      value: new BigNumber(1),
      fee: new BigNumber(0),
      senders: [],
      recipients: [],
      date: new Date("2026-10-01T00:00:00Z"),
      blockHeight: null,
      accountId: "a",
      extra: { inputs },
    }) as never;
  const bitcoinAccount = (): Account =>
    ({
      type: "Account",
      id: `js:2:bitcoin:${XPUB}:native_segwit`,
      currency: bitcoin,
      derivationMode: "native_segwit",
      index: 0,
      freshAddress: "addr-0-0",
      freshAddressPath: "84'/0'/0'/0/0",
      operations: [],
      pendingOperations: [
        operation("first-send", ["funding-1"]),
        operation("orig-txid", ["funding-1"]),
      ],
      bitcoinResources: {
        utxos: [],
        accountState: versioned({
          ...emptyState(),
          addresses: [{ address: "addr-0-0", chain: 0, index: 0 }],
        }),
      },
    }) as unknown as Account;
  const coinModule = {
    deriveAddress: jest.fn(
      async (_context: unknown, { chain, index }: { chain: number; index: number }) =>
        `addr-${chain}-${index}`,
    ),
    getTransaction: jest.fn(async () => ({
      id: "orig-txid",
      fees: 1000n,
      inputs: [{ txid: "funding", vout: 1, address: "addr-0-0", value: "5000" }],
      outputs: [],
    })),
    craftTransactionData: jest.fn(() => ({ type: "bitcoin" })),
    estimateFees: jest.fn(async () => ({
      value: 3000n,
      parameters: {
        feeRates: { slow: 1n, medium: 2n, fast: 3n },
        minReplacementFee: 3000n,
        originalFee: 1000n,
        replacedOutputs: [{ address: "bc1qthem", value: 4000n }],
      },
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCoinModuleApi.mockResolvedValue(coinModule);
    mockedBuildContext.mockReturnValue(context);
    mockLiveConfig({
      config_portfolio_service: { url: "", portfolioId: "wallet" },
      config_currency_bitcoin: { portfolio: { enabled: true, mode: "local" } },
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("lets the account module complete the replacement and the coin module price it", async () => {
    const result = await getReplacementEstimate(bitcoinAccount(), "orig-txid");

    // One estimate: the module read the replaced transaction and found the conflicting pending
    // send in the history Ledger Wallet seeded.
    expect(coinModule.getTransaction).toHaveBeenCalledWith(context, "orig-txid");
    expect(coinModule.estimateFees).toHaveBeenCalledTimes(1);
    expect(coinModule.estimateFees).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        type: REPLACE_SPEEDUP,
        amount: 0n,
        recipient: "",
        asset: { type: "native" },
        data: expect.objectContaining({
          type: "bitcoin",
          inputs: [expect.objectContaining({ txid: "funding", vout: 1, address: "addr-0-0" })],
          replacement: { txid: "orig-txid", conflictingTxIds: ["first-send"] },
        }),
      }),
      { customFeesParameters: { feesStrategy: "fast" } },
    );
    expect(result).toEqual({
      feeRates: { slow: 1n, medium: 2n, fast: 3n },
      minReplacementFee: 3000n,
      originalFee: 1000n,
      replacedOutputs: [{ address: "bc1qthem", value: 4000n }],
    });
  });

  it("asks the portfolio an edit already opened", async () => {
    const estimateTransactionFee = jest.fn(async () => ({
      value: "3000",
      parameters: { originalFeePerByte: "10" },
    }));
    const opened = {
      portfolio: { estimateTransactionFee },
      network: "bitcoin",
      key: XPUB,
    } as never;

    await expect(getReplacementEstimate(bitcoinAccount(), "orig-txid", opened)).resolves.toEqual({
      originalFeePerByte: 10n,
    });
    expect(estimateTransactionFee).toHaveBeenCalledWith("bitcoin", {
      intent: {
        type: REPLACE_SPEEDUP,
        sender: XPUB,
        amount: "0",
        asset: "native",
        networkParams: {
          accountOptions: { replaceTxId: "orig-txid" },
          feeParameters: { feesStrategy: "fast" },
        },
      },
    });
    expect(mockedGetCoinModuleApi).not.toHaveBeenCalled();
  });
});

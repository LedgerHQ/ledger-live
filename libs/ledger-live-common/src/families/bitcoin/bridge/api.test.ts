import network from "@ledgerhq/live-network";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getBitcoinCoinConfig } from "../coinConfig";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinTxData } from "@ledgerhq/coin-bitcoin/logic/intent";
import { transactionToIntent } from "../../../bridge/generic-coin-framework/utils";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import bitcoinBridge, { buildIntentData, getFeeItems } from "./api";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../coinConfig", () => ({
  getBitcoinCoinConfig: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const mockedGetBitcoinCoinConfig = jest.mocked(getBitcoinCoinConfig);

const configWith = (url: string, explorerId = "btc"): BitcoinCoinConfig => ({
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorerId,
  explorer: { url },
});

describe("getFeeItems", () => {
  // Each test uses its own currency so the module-level fee-rate cache starts cold.
  beforeEach(() => {
    mockedNetwork.mockReset();
    mockedNetwork.mockResolvedValue({
      data: { "1": 3000, "3": 2000, "6": 1000 },
      status: 200,
    } as any);
  });

  it("serves cached fee rates while the explorer is unchanged", async () => {
    const currency = getCryptoCurrencyById("litecoin");
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://first.test.invalid", "ltc"));

    await getFeeItems(currency);
    await getFeeItems(currency);

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("fetches from the new explorer when its endpoint changes with an unchanged TTL", async () => {
    const currency = getCryptoCurrencyById("dogecoin");
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://first.test.invalid", "doge"));
    await getFeeItems(currency);

    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://second.test.invalid", "doge"));
    await getFeeItems(currency);

    expect(mockedNetwork).toHaveBeenCalledTimes(2);
    expect(mockedNetwork).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: "https://second.test.invalid/blockchain/v4/doge/fees" }),
    );
  });

  it("returns the default fee rate for the medium block target", async () => {
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://explorer.test.invalid"));

    const { defaultFeePerByte, items } = await getFeeItems(getCryptoCurrencyById("bitcoin"));

    expect(defaultFeePerByte.toNumber()).toBe(2);
    expect(items.map(item => item.speed)).toEqual(["fast", "medium", "slow"]);
  });
});

describe("buildIntentData", () => {
  const utxoStrategy = {
    strategy: "optimize-size",
    selectedUtxos: ["aa:0"],
    excludedUtxos: ["bb:1", "cc:2"],
  };

  it("returns bitcoin data without options for a plain transaction", () => {
    expect(buildIntentData({})).toEqual({ type: "unknown" });
  });

  it("passes the OP_RETURN data through as hex, from a string or a buffer", () => {
    expect(buildIntentData({ opReturnData: "abcd" })).toEqual({
      type: "unknown",
      opReturnData: "abcd",
    });
    expect(buildIntentData({ opReturnData: Buffer.from("hello") })).toEqual({
      type: "unknown",
      opReturnData: "68656c6c6f",
    });
    expect(buildIntentData({ opReturnData: Buffer.alloc(0) })).toEqual({ type: "unknown" });
  });

  it("passes the coin control through", () => {
    expect(buildIntentData({ utxoStrategy })).toEqual({ type: "unknown", utxoStrategy });
  });

  it("drops values of the wrong type", () => {
    expect(
      buildIntentData({
        opReturnData: 12,
        utxoStrategy: { strategy: 1, selectedUtxos: "aa:0", excludedUtxos: ["bb:1", 2] },
      }),
    ).toEqual({ type: "unknown" });
    expect(buildIntentData({ utxoStrategy: "deep-outputs-first" })).toEqual({ type: "unknown" });
    expect(buildIntentData({ utxoStrategy: null })).toEqual({ type: "unknown" });
  });

  it("is the hook of the bitcoin bridge api", () => {
    expect(bitcoinBridge(getCryptoCurrencyById("bitcoin")).buildIntentData).toBe(buildIntentData);
  });

  describe("through transactionToIntent", () => {
    const account = { freshAddress: "bcrt1qsender", xpub: "xpub" } as Account;
    const transaction = {
      family: "bitcoin",
      recipient: "bcrt1qrecipient",
      amount: new BigNumber(1000),
      utxoStrategy,
      opReturnData: Buffer.from("memo"),
    } as unknown as GenericTransaction;
    // What the coin module crafts on its own: no coin control.
    const craftTransactionData = jest.fn(() => ({ type: "unknown" as const }));

    it("puts the coin control and the OP_RETURN data in intent.data, ahead of the module's crafting", () => {
      const intent = transactionToIntent(
        account,
        transaction,
        undefined,
        craftTransactionData,
        buildIntentData,
      );
      const data = intent.data as BitcoinTxData;
      expect(data).toEqual({ type: "unknown", opReturnData: "6d656d6f", utxoStrategy });
      expect(craftTransactionData).not.toHaveBeenCalled();
    });

    it("loses the coin control without the hook", () => {
      const intent = transactionToIntent(account, transaction, undefined, craftTransactionData);
      expect(intent.data).toEqual({ type: "unknown" });
    });
  });
});

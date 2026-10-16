/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  NotEnoughBalance,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CoinControlDisplayData, CoinControlUtxoRow } from "../../../bridge/descriptor/types";
import type { Transaction, TransactionStatus } from "../../../coin-modules/transaction-types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { bitcoinCoinControlConfig } from "./coinControl";
import { bitcoinPickingStrategy } from "../types";
import type {
  BitcoinFamilySpecificData,
  BitcoinFeeParametersJson,
  BitcoinOutput,
  UtxoStrategy,
} from "../types";

jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const {
  getDisplayData,
  getStrategyValue,
  getChangeToReturn,
  buildStrategyChangePatch,
  buildToggleRowExclusionPatch,
  customStrategyValue,
} = bitcoinCoinControlConfig;

type BtcTransaction = Extract<Transaction, { family: "bitcoin" }>;

function mergeStrategy(): UtxoStrategy {
  return { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] };
}

function customStrategy(excludeUTXOs: UtxoStrategy["excludeUTXOs"]): UtxoStrategy {
  return { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs };
}

function makeUtxo(
  partial: Partial<BitcoinOutput> & Pick<BitcoinOutput, "hash" | "outputIndex" | "value">,
): BitcoinOutput {
  return {
    blockHeight: 799_000,
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    rbf: false,
    isChange: false,
    ...partial,
  };
}

function makeBitcoinAccount(
  utxos: BitcoinOutput[] | undefined,
  overrides: Record<string, unknown> = {},
): AccountLike {
  const currency = getCryptoCurrencyById("bitcoin");
  return {
    type: "Account",
    id: "btc-1",
    name: "Bitcoin",
    currency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 800_000,
    lastSyncDate: new Date(),
    bitcoinResources: { utxos },
    ...overrides,
  } as unknown as AccountLike;
}

type TransactionOverrides = Partial<Omit<BtcTransaction, "feeParameters">> & {
  utxoStrategy?: UtxoStrategy;
  feeParameters?: BitcoinFeeParametersJson;
};

function btcTx({
  utxoStrategy,
  familySpecificData,
  feeParameters,
  ...overrides
}: TransactionOverrides = {}): BtcTransaction {
  const data: BitcoinFamilySpecificData = {
    ...familySpecificData,
    ...(utxoStrategy ? { utxoStrategy } : {}),
  };
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...(Object.keys(data).length > 0 ? { familySpecificData: data } : {}),
    ...(feeParameters ? { feeParameters } : {}),
    ...overrides,
  } as BtcTransaction;
}

function makeTransaction(overrides: TransactionOverrides = {}): Transaction {
  return btcTx(overrides) as Transaction;
}

function makeStatus(overrides: Partial<TransactionStatus> = {}): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    ...overrides,
  } as TransactionStatus;
}

function displayRow(
  rowKey: string,
  overrides: Partial<CoinControlUtxoRow> = {},
): CoinControlUtxoRow {
  return {
    rowKey,
    titleLabel: "",
    formattedValue: "",
    excluded: false,
    exclusionReason: undefined,
    isUsedInTx: false,
    unconfirmed: false,
    disabled: false,
    confirmations: 0,
    ...overrides,
  };
}

function makeDisplayData(rows: CoinControlDisplayData["utxoRows"]): CoinControlDisplayData {
  return {
    pickingStrategyOptions: [],
    pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
    totalExcludedUTXOS: rows.filter(r => r.excluded).length,
    totalSpent: new BigNumber(0),
    utxoRows: rows,
  };
}

function display(
  account: AccountLike,
  transaction: Transaction,
  status: TransactionStatus = makeStatus(),
) {
  return getDisplayData({ account, transaction, status, locale: "en" });
}

const evmTransaction = {
  family: "evm",
  amount: new BigNumber(0),
  recipient: "",
} as unknown as Transaction;

describe("bitcoinCoinControlConfig", () => {
  describe("getDisplayData", () => {
    const singleUtxoAccount = makeBitcoinAccount([
      makeUtxo({ hash: "aa", outputIndex: 0, value: new BigNumber(1000) }),
    ]);

    it.each([
      {
        name: "account has no bitcoinResources",
        account: {
          type: "Account",
          currency: getCryptoCurrencyById("bitcoin"),
        } as unknown as AccountLike,
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
      },
      {
        name: "account bitcoinResources is undefined",
        account: makeBitcoinAccount([], { bitcoinResources: undefined }),
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
      },
      {
        name: "transaction is not a bitcoin transaction",
        account: singleUtxoAccount,
        transaction: evmTransaction,
      },
      {
        name: "there are no UTXOs",
        account: makeBitcoinAccount([]),
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
      },
      {
        name: "the UTXO list is missing",
        account: makeBitcoinAccount(undefined),
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
      },
    ])("should return null when $name", ({ account, transaction }) => {
      expect(display(account, transaction)).toBeNull();
    });

    it("should fall back to the default picking strategy when the transaction carries none", () => {
      const data = display(singleUtxoAccount, makeTransaction(), {
        errors: {},
        warnings: {},
      } as unknown as TransactionStatus);

      expect(data).not.toBeNull();
      expect(data!.pickingStrategyValue).toBe(bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST);
      expect(data!.totalSpent.isZero()).toBe(true);
      expect(data!.utxoRows[0]).toMatchObject({ rowKey: "aa-0", excluded: false });
    });

    it("should map UTXOs to rows with picking strategy options and totals", () => {
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "txhash1", outputIndex: 0, value: new BigNumber(50_000) }),
        makeUtxo({
          hash: "txhash2",
          outputIndex: 1,
          value: new BigNumber(30_000),
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        }),
      ]);

      const data = display(
        account,
        makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
          feeParameters: {
            inputs: [{ txid: "txhash1", vout: 0, value: "50000", address: "addr" }],
          },
        }),
        makeStatus({ totalSpent: new BigNumber(12_345) }),
      );

      expect(data).not.toBeNull();
      expect(data!.pickingStrategyValue).toBe(bitcoinPickingStrategy.OPTIMIZE_SIZE);
      expect(data!.totalExcludedUTXOS).toBe(0);
      expect(data!.totalSpent.isEqualTo(12_345)).toBe(true);
      expect(data!.pickingStrategyOptions).toEqual([
        { value: 0, labelKey: "bitcoin.pickingStrategyLabels.DEEP_OUTPUTS_FIRST" },
        { value: 1, labelKey: "bitcoin.pickingStrategyLabels.OPTIMIZE_SIZE" },
        { value: 2, labelKey: "bitcoin.pickingStrategyLabels.MERGE_OUTPUTS" },
        { value: 3, labelKey: "bitcoin.pickingStrategyLabels.CUSTOM" },
      ]);
      expect(data!.utxoRows).toHaveLength(2);
      expect(data!.utxoRows[0]).toMatchObject({
        rowKey: "txhash1-0",
        titleLabel: "#1 1A1zP1eP...vfNa",
        formattedValue: "50000 BTC",
        excluded: false,
        isUsedInTx: true,
        unconfirmed: false,
        disabled: false,
        confirmations: 1000,
      });
      expect(data!.utxoRows[1]).toMatchObject({
        rowKey: "txhash2-1",
        titleLabel: "#2 bc1qxy2k...0wlh",
        isUsedInTx: false,
      });
    });

    it("should only mark the exact outpoint of an estimation input as used", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "same", outputIndex: 0, value: new BigNumber(1000) }),
          makeUtxo({ hash: "same", outputIndex: 1, value: new BigNumber(1000) }),
        ]),
        makeTransaction({
          feeParameters: { inputs: [{ txid: "same", vout: 1, value: "1000", address: "a" }] },
        }),
      );

      expect(data!.utxoRows.map(r => r.isUsedInTx)).toEqual([false, true]);
    });

    it("should label a row without address by its index only", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "noaddr", outputIndex: 0, value: new BigNumber(1000), address: null }),
        ]),
        makeTransaction(),
      );

      expect(data!.utxoRows[0].titleLabel).toBe("#1");
    });

    it("should mark pending UTXO as unconfirmed and disabled", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({
            hash: "pending",
            outputIndex: 0,
            value: new BigNumber(1000),
            blockHeight: null,
            isChange: false,
          }),
        ]),
        makeTransaction({ utxoStrategy: mergeStrategy() }),
      );

      expect(data!.utxoRows[0]).toMatchObject({
        excluded: true,
        exclusionReason: "pickPendingUtxo",
        unconfirmed: true,
        disabled: true,
        confirmations: 0,
      });
      expect(data!.totalExcludedUTXOS).toBe(1);
    });

    it("should keep a pending change UTXO selectable", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({
            hash: "change",
            outputIndex: 0,
            value: new BigNumber(1000),
            blockHeight: null,
            isChange: true,
          }),
        ]),
        makeTransaction({ utxoStrategy: mergeStrategy() }),
      );

      expect(data!.utxoRows[0]).toMatchObject({
        excluded: false,
        exclusionReason: undefined,
        unconfirmed: false,
        disabled: false,
        confirmations: 0,
      });
    });

    it("should count no confirmation when the account has no block height", () => {
      const data = display(
        makeBitcoinAccount([makeUtxo({ hash: "aa", outputIndex: 0, value: new BigNumber(1000) })], {
          blockHeight: undefined,
        }),
        makeTransaction(),
      );

      expect(data!.utxoRows[0].confirmations).toBe(0);
    });

    it("should reflect user-excluded UTXOs in CUSTOM strategy", () => {
      const data = display(
        makeBitcoinAccount([makeUtxo({ hash: "ex", outputIndex: 2, value: new BigNumber(5000) })]),
        makeTransaction({ utxoStrategy: customStrategy([{ hash: "ex", outputIndex: 2 }]) }),
      );

      expect(data!.utxoRows[0]).toMatchObject({
        excluded: true,
        exclusionReason: "userExclusion",
        unconfirmed: false,
      });
    });

    it("should set amountTargetReached and disable user-excluded rows when target is met", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(20_000) }),
          makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(20_000) }),
        ]),
        makeTransaction({
          amount: new BigNumber(10_000),
          useAllAmount: false,
          utxoStrategy: customStrategy([{ hash: "b", outputIndex: 0 }]),
        }),
        makeStatus({ estimatedFees: new BigNumber(1000), errors: {} }),
      );

      expect(data!.utxoRows.find(r => r.rowKey === "a-0")).toMatchObject({
        excluded: false,
        disabled: false,
      });
      expect(data!.utxoRows.find(r => r.rowKey === "b-0")).toMatchObject({
        excluded: true,
        exclusionReason: "userExclusion",
        disabled: true,
      });
    });

    it("should compare against the amount alone when there is neither totalSpent nor fees", () => {
      const tx = makeTransaction({
        amount: new BigNumber(20_000),
        utxoStrategy: customStrategy([{ hash: "b", outputIndex: 0 }]),
      });
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(20_000) }),
        makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(20_000) }),
      ]);
      const status = makeStatus({ estimatedFees: undefined, totalSpent: undefined });

      expect(display(account, tx, status)!.utxoRows[1].disabled).toBe(true);
    });

    it("should not treat amount as reached when the selection does not cover it", () => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(1000) }),
          makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(20_000) }),
        ]),
        makeTransaction({
          amount: new BigNumber(10_000),
          utxoStrategy: customStrategy([{ hash: "b", outputIndex: 0 }]),
        }),
        makeStatus({ totalSpent: new BigNumber(10_500) }),
      );

      expect(data!.utxoRows.find(r => r.rowKey === "b-0")?.disabled).toBe(false);
    });

    it.each([
      ["NotEnoughBalance", new NotEnoughBalance()],
      ["NotEnoughSpendableBalance", new NotEnoughSpendableBalance()],
    ])("should not treat amount as reached when %s is present", (_, error) => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(100_000) }),
          makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(100_000) }),
        ]),
        makeTransaction({
          amount: new BigNumber(1000),
          useAllAmount: false,
          utxoStrategy: customStrategy([{ hash: "b", outputIndex: 0 }]),
        }),
        makeStatus({ estimatedFees: new BigNumber(0), errors: { amount: error } }),
      );

      expect(data!.utxoRows.find(r => r.rowKey === "b-0")?.disabled).toBe(false);
    });

    it.each([
      ["the max amount is sent", { amount: new BigNumber(1000), useAllAmount: true }],
      ["no amount is entered", { amount: new BigNumber(0), useAllAmount: false }],
    ])("should not treat amount as reached when %s", (_, amounts) => {
      const data = display(
        makeBitcoinAccount([
          makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(100_000) }),
          makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(100_000) }),
        ]),
        makeTransaction({
          ...amounts,
          utxoStrategy: customStrategy([{ hash: "b", outputIndex: 0 }]),
        }),
      );

      expect(data!.utxoRows.find(r => r.rowKey === "b-0")?.disabled).toBe(false);
    });
  });

  describe("getStrategyValue", () => {
    it("should return the picking strategy of a bitcoin transaction", () => {
      expect(getStrategyValue(makeTransaction({ utxoStrategy: customStrategy([]) }))).toBe(
        bitcoinPickingStrategy.CUSTOM,
      );
    });

    it("should return the default strategy when the transaction carries none", () => {
      expect(getStrategyValue(makeTransaction())).toBe(bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST);
    });

    it("should return undefined for a non bitcoin transaction", () => {
      expect(getStrategyValue(evmTransaction)).toBeUndefined();
    });
  });

  describe("getChangeToReturn", () => {
    it("should sum the change outputs of the last estimation", () => {
      const transaction = makeTransaction({
        feeParameters: {
          outputs: [
            { address: "recipient", value: "40000", isChange: false },
            { address: "change1", value: "1500", isChange: true },
            { address: "change2", value: "500", isChange: true },
            { address: null, value: "0", isChange: false },
          ],
        },
      });

      expect(getChangeToReturn({ transaction, status: makeStatus() }).toFixed()).toBe("2000");
    });

    it("should return zero when the estimation has no change output", () => {
      const transaction = makeTransaction({
        feeParameters: { outputs: [{ address: "recipient", value: "40000", isChange: false }] },
      });

      expect(getChangeToReturn({ transaction, status: makeStatus() }).isZero()).toBe(true);
    });

    it("should return zero when the transaction has not been estimated", () => {
      expect(
        getChangeToReturn({ transaction: makeTransaction(), status: undefined }).isZero(),
      ).toBe(true);
    });

    it("should return zero for a non bitcoin transaction", () => {
      expect(
        getChangeToReturn({ transaction: evmTransaction, status: makeStatus() }).isZero(),
      ).toBe(true);
    });
  });

  describe("buildStrategyChangePatch", () => {
    it.each([
      ["a non bitcoin transaction", { family: "evm" }],
      ["a null transaction", null],
      ["a non object transaction", "bitcoin"],
    ])("should return null for %s", (_, transaction) => {
      expect(
        buildStrategyChangePatch({
          transaction,
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          displayData: null,
        }),
      ).toBeNull();
    });

    it("should set the strategy on a bitcoin transaction that carries none", () => {
      expect(
        buildStrategyChangePatch({
          transaction: makeTransaction(),
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          displayData: null,
        }),
      ).toEqual({
        familySpecificData: {
          utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
        },
      });
    });

    it("should clear excludeUTXOs when switching away from CUSTOM", () => {
      const tx = btcTx({
        utxoStrategy: customStrategy([{ hash: "x", outputIndex: 0 }]),
      });

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
        displayData: makeDisplayData([displayRow("x-0")]),
      });

      expect(patch).toEqual({
        familySpecificData: {
          utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
        },
      });
    });

    it("should derive excludeUTXOs from display row keys when selecting CUSTOM", () => {
      const tx = btcTx({ utxoStrategy: mergeStrategy() });

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData: makeDisplayData([
          displayRow("dead-beef-0"),
          displayRow("invalid-key"),
          displayRow("nodash"),
          displayRow("-1"),
        ]),
      });

      expect(patch).toEqual({
        familySpecificData: {
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.CUSTOM,
            excludeUTXOs: [{ hash: "dead-beef", outputIndex: 0 }],
          },
        },
      });
    });

    it("should use empty excludeUTXOs for CUSTOM when displayData is null", () => {
      const tx = btcTx({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [{ hash: "old", outputIndex: 1 }],
        },
      });

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData: null,
      });

      expect(patch).toEqual({
        familySpecificData: {
          utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
        },
      });
    });

    it("should keep the transaction's other user choices", () => {
      const tx = btcTx({
        utxoStrategy: mergeStrategy(),
        familySpecificData: { feePerByte: "12", opReturnData: "cafe" },
      });

      expect(
        buildStrategyChangePatch({
          transaction: tx,
          strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
          displayData: null,
        }),
      ).toEqual({
        familySpecificData: {
          feePerByte: "12",
          opReturnData: "cafe",
          utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
        },
      });
    });
  });

  describe("buildToggleRowExclusionPatch", () => {
    it("should return null for a non bitcoin transaction", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: evmTransaction,
          rowKey: "a-0",
          displayData: makeDisplayData([displayRow("a-0")]),
        }),
      ).toBeNull();
    });

    it("should return null when strategy is not CUSTOM", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx({ utxoStrategy: mergeStrategy() }),
          rowKey: "a-0",
          displayData: makeDisplayData([displayRow("a-0")]),
        }),
      ).toBeNull();
    });

    it("should return null when the transaction carries no strategy (default is not CUSTOM)", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx(),
          rowKey: "a-0",
          displayData: makeDisplayData([displayRow("a-0")]),
        }),
      ).toBeNull();
    });

    it.each([
      ["displayData is null", null],
      ["the row is not displayed", makeDisplayData([displayRow("other-0")])],
    ])("should return null when %s", (_, displayData) => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx({ utxoStrategy: customStrategy([]) }),
          rowKey: "a-0",
          displayData,
        }),
      ).toBeNull();
    });

    it("should return null when row is disabled", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx({ utxoStrategy: customStrategy([]) }),
          rowKey: "a-0",
          displayData: makeDisplayData([displayRow("a-0", { unconfirmed: true, disabled: true })]),
        }),
      ).toBeNull();
    });

    it("should return null when the row key is not an outpoint", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx({ utxoStrategy: customStrategy([]) }),
          rowKey: "nodash",
          displayData: makeDisplayData([displayRow("nodash")]),
        }),
      ).toBeNull();
    });

    it("should add UTXO to excludeUTXOs when row is not excluded", () => {
      const tx = btcTx({
        utxoStrategy: customStrategy([]),
        familySpecificData: { feePerByte: "3" },
      });

      expect(
        buildToggleRowExclusionPatch({
          transaction: tx,
          rowKey: "abc-1",
          displayData: makeDisplayData([displayRow("abc-1")]),
        }),
      ).toEqual({
        familySpecificData: {
          feePerByte: "3",
          utxoStrategy: customStrategy([{ hash: "abc", outputIndex: 1 }]),
        },
      });
    });

    it("should remove UTXO from excludeUTXOs when row is excluded", () => {
      const tx = btcTx({
        utxoStrategy: customStrategy([
          { hash: "abc", outputIndex: 1 },
          { hash: "abc", outputIndex: 2 },
          { hash: "keep", outputIndex: 1 },
        ]),
      });

      const patch = buildToggleRowExclusionPatch({
        transaction: tx,
        rowKey: "abc-1",
        displayData: makeDisplayData([
          displayRow("abc-1", { excluded: true, exclusionReason: "userExclusion" }),
        ]),
      });

      expect(patch).toEqual({
        familySpecificData: {
          utxoStrategy: customStrategy([
            { hash: "abc", outputIndex: 2 },
            { hash: "keep", outputIndex: 1 },
          ]),
        },
      });
    });
  });

  describe("customStrategyValue", () => {
    it("should match bitcoinPickingStrategy.CUSTOM", () => {
      expect(customStrategyValue).toBe(bitcoinPickingStrategy.CUSTOM);
    });
  });
});

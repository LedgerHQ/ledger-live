/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { TransactionStatus as BtcTransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CoinControlDisplayData, CoinControlUtxoRow } from "../../../bridge/descriptor/types";
import type { Transaction, TransactionStatus } from "../../../generated/types";
import { getCryptoCurrencyById } from "../../../currencies";
import { bitcoinCoinControlConfig } from "./coinControl";
import { bitcoinPickingStrategy } from "../types";
import type { BitcoinOutput } from "../types";

jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const {
  getDisplayData,
  buildStrategyChangePatch,
  buildToggleRowExclusionPatch,
  customStrategyValue,
} = bitcoinCoinControlConfig;

type BtcTransaction = Extract<Transaction, { family: "bitcoin" }>;

function mergeStrategy(): BtcTransaction["utxoStrategy"] {
  return { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] };
}

function customStrategy(
  excludeUTXOs: BtcTransaction["utxoStrategy"]["excludeUTXOs"],
): BtcTransaction["utxoStrategy"] {
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

function makeBitcoinAccount(utxos: BitcoinOutput[]): AccountLike {
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
  } as unknown as AccountLike;
}

function makeTransaction(
  overrides: Partial<BtcTransaction> & Pick<BtcTransaction, "utxoStrategy">,
): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  } as BtcTransaction as Transaction;
}

function btcTx(
  overrides: Partial<BtcTransaction> & Pick<BtcTransaction, "utxoStrategy">,
): BtcTransaction {
  return makeTransaction(overrides) as BtcTransaction;
}

function makeStatus(overrides: Partial<BtcTransactionStatus> = {}): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
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
        name: "utxoStrategy is missing on transaction",
        account: singleUtxoAccount,
        transaction: { family: "bitcoin", amount: new BigNumber(0) } as unknown as Transaction,
      },
      {
        name: "status has no txInputs field",
        account: singleUtxoAccount,
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
        status: { errors: {}, warnings: {} } as unknown as TransactionStatus,
      },
      {
        name: "there are no UTXOs",
        account: makeBitcoinAccount([]),
        transaction: makeTransaction({ utxoStrategy: mergeStrategy() }),
      },
    ])("should return null when $name", ({ account, transaction, status }) => {
      expect(display(account, transaction, status ?? makeStatus())).toBeNull();
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
        }),
        makeStatus({
          totalSpent: new BigNumber(12_345),
          txInputs: [
            { address: null, value: null, previousTxHash: "txhash1", previousOutputIndex: 0 },
          ],
        }),
      );

      expect(data).not.toBeNull();
      expect(data!.pickingStrategyValue).toBe(bitcoinPickingStrategy.OPTIMIZE_SIZE);
      expect(data!.totalExcludedUTXOS).toBe(0);
      expect(data!.totalSpent.isEqualTo(12_345)).toBe(true);
      expect(data!.pickingStrategyOptions.length).toBeGreaterThan(0);
      expect(data!.utxoRows).toHaveLength(2);
      expect(data!.utxoRows[0]).toMatchObject({
        rowKey: "txhash1-0",
        excluded: false,
        isUsedInTx: true,
        unconfirmed: false,
        disabled: false,
        confirmations: 1000,
      });
      expect(data!.utxoRows[0].titleLabel.startsWith("#1 ")).toBe(true);
      expect(data!.utxoRows[1]).toMatchObject({ rowKey: "txhash2-1", isUsedInTx: false });
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
      });
      expect(data!.totalExcludedUTXOS).toBe(1);
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

    it("should not treat amount as reached when NotEnoughBalance is present", () => {
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
        makeStatus({ estimatedFees: new BigNumber(0), errors: { amount: new NotEnoughBalance() } }),
      );

      expect(data!.utxoRows.find(r => r.rowKey === "b-0")?.disabled).toBe(false);
    });
  });

  describe("buildStrategyChangePatch", () => {
    it("should return null when transaction has no utxoStrategy", () => {
      expect(
        buildStrategyChangePatch({
          transaction: { family: "bitcoin" },
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          displayData: null,
        }),
      ).toBeNull();
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
        utxoStrategy: {
          ...tx.utxoStrategy,
          strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
          excludeUTXOs: [],
        },
      });
    });

    it("should derive excludeUTXOs from display row keys when selecting CUSTOM", () => {
      const tx = btcTx({ utxoStrategy: mergeStrategy() });

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData: makeDisplayData([displayRow("dead-beef-0"), displayRow("invalid-key")]),
      });

      expect(patch).toEqual({
        utxoStrategy: {
          ...tx.utxoStrategy,
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [{ hash: "dead-beef", outputIndex: 0 }],
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
        utxoStrategy: expect.objectContaining({ excludeUTXOs: [] }),
      });
    });
  });

  describe("buildToggleRowExclusionPatch", () => {
    it("should return null when strategy is not CUSTOM", () => {
      expect(
        buildToggleRowExclusionPatch({
          transaction: btcTx({ utxoStrategy: mergeStrategy() }),
          rowKey: "a-0",
          displayData: makeDisplayData([]),
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

    it("should add UTXO to excludeUTXOs when row is not excluded", () => {
      const tx = btcTx({ utxoStrategy: customStrategy([]) });

      expect(
        buildToggleRowExclusionPatch({
          transaction: tx,
          rowKey: "abc-1",
          displayData: makeDisplayData([displayRow("abc-1")]),
        }),
      ).toEqual({
        utxoStrategy: { ...tx.utxoStrategy, excludeUTXOs: [{ hash: "abc", outputIndex: 1 }] },
      });
    });

    it("should remove UTXO from excludeUTXOs when row is excluded", () => {
      const tx = btcTx({
        utxoStrategy: customStrategy([
          { hash: "abc", outputIndex: 1 },
          { hash: "keep", outputIndex: 0 },
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
        utxoStrategy: expect.objectContaining({
          excludeUTXOs: [{ hash: "keep", outputIndex: 0 }],
        }),
      });
    });
  });

  describe("customStrategyValue", () => {
    it("should match bitcoinPickingStrategy.CUSTOM", () => {
      expect(customStrategyValue).toBe(bitcoinPickingStrategy.CUSTOM);
    });
  });
});

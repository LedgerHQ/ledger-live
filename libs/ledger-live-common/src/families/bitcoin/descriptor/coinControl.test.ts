/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { TransactionStatus as BtcTransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CoinControlDisplayData } from "../../../bridge/descriptor/types";
import type { Transaction, TransactionStatus } from "../../../generated/types";
import { getCryptoCurrencyById } from "../../../currencies";
import { bitcoinCoinControlConfig } from "./coinControl";
import { bitcoinPickingStrategy } from "../types";
import type { BitcoinOutput } from "../types";

jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const {
  getDisplayData,
  buildStrategyChangePatch,
  buildToggleRowExclusionPatch,
  customStrategyValue,
} = bitcoinCoinControlConfig;

type BtcTransaction = Extract<Transaction, { family: "bitcoin" }>;

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

function makeDisplayData(rows: CoinControlDisplayData["utxoRows"]): CoinControlDisplayData {
  return {
    pickingStrategyOptions: [],
    pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
    totalExcludedUTXOS: rows.filter(r => r.excluded).length,
    totalSpent: new BigNumber(0),
    utxoRows: rows,
  };
}

describe("bitcoinCoinControlConfig", () => {
  describe("getDisplayData", () => {
    it("should return null when account has no bitcoinResources", () => {
      const currency = getCryptoCurrencyById("bitcoin");
      const account = {
        type: "Account",
        currency,
      } as unknown as AccountLike;

      const result = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
        }),
        status: makeStatus(),
        locale: "en",
      });

      expect(result).toBeNull();
    });

    it("should return null when utxoStrategy is missing on transaction", () => {
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "aa", outputIndex: 0, value: new BigNumber(1000) }),
      ]);

      const result = getDisplayData({
        account,
        transaction: { family: "bitcoin", amount: new BigNumber(0) } as unknown as Transaction,
        status: makeStatus(),
        locale: "en",
      });

      expect(result).toBeNull();
    });

    it("should return null when status has no txInputs field", () => {
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "aa", outputIndex: 0, value: new BigNumber(1000) }),
      ]);

      const result = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
        }),
        status: { errors: {}, warnings: {} } as unknown as TransactionStatus,
        locale: "en",
      });

      expect(result).toBeNull();
    });

    it("should return null when there are no UTXOs", () => {
      const account = makeBitcoinAccount([]);

      const result = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
        }),
        status: makeStatus(),
        locale: "en",
      });

      expect(result).toBeNull();
    });

    it("should map UTXOs to rows with picking strategy options and totals", () => {
      const utxos = [
        makeUtxo({ hash: "txhash1", outputIndex: 0, value: new BigNumber(50_000) }),
        makeUtxo({
          hash: "txhash2",
          outputIndex: 1,
          value: new BigNumber(30_000),
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        }),
      ];
      const account = makeBitcoinAccount(utxos);

      const data = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
        }),
        status: makeStatus({
          totalSpent: new BigNumber(12_345),
          txInputs: [
            {
              address: null,
              value: null,
              previousTxHash: "txhash1",
              previousOutputIndex: 0,
            },
          ],
        }),
        locale: "en",
      });

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
      expect(data!.utxoRows[1]).toMatchObject({
        rowKey: "txhash2-1",
        isUsedInTx: false,
      });
    });

    it("should mark pending UTXO as unconfirmed and disabled", () => {
      const account = makeBitcoinAccount([
        makeUtxo({
          hash: "pending",
          outputIndex: 0,
          value: new BigNumber(1000),
          blockHeight: null,
          isChange: false,
        }),
      ]);

      const data = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
        }),
        status: makeStatus(),
        locale: "en",
      });

      expect(data!.utxoRows[0]).toMatchObject({
        excluded: true,
        exclusionReason: "pickPendingUtxo",
        unconfirmed: true,
        disabled: true,
      });
      expect(data!.totalExcludedUTXOS).toBe(1);
    });

    it("should reflect user-excluded UTXOs in CUSTOM strategy", () => {
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "ex", outputIndex: 2, value: new BigNumber(5000) }),
      ]);

      const data = getDisplayData({
        account,
        transaction: makeTransaction({
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.CUSTOM,
            excludeUTXOs: [{ hash: "ex", outputIndex: 2 }],
          },
        }),
        status: makeStatus(),
        locale: "en",
      });

      expect(data!.utxoRows[0]).toMatchObject({
        excluded: true,
        exclusionReason: "userExclusion",
        unconfirmed: false,
      });
    });

    it("should set amountTargetReached and disable user-excluded rows when target is met", () => {
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(20_000) }),
        makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(20_000) }),
      ]);

      const data = getDisplayData({
        account,
        transaction: makeTransaction({
          amount: new BigNumber(10_000),
          useAllAmount: false,
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.CUSTOM,
            excludeUTXOs: [{ hash: "b", outputIndex: 0 }],
          },
        }),
        status: makeStatus({
          estimatedFees: new BigNumber(1000),
          errors: {},
        }),
        locale: "en",
      });

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
      const account = makeBitcoinAccount([
        makeUtxo({ hash: "a", outputIndex: 0, value: new BigNumber(100_000) }),
        makeUtxo({ hash: "b", outputIndex: 0, value: new BigNumber(100_000) }),
      ]);

      const data = getDisplayData({
        account,
        transaction: makeTransaction({
          amount: new BigNumber(1000),
          useAllAmount: false,
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.CUSTOM,
            excludeUTXOs: [{ hash: "b", outputIndex: 0 }],
          },
        }),
        status: makeStatus({
          estimatedFees: new BigNumber(0),
          errors: { amount: new NotEnoughBalance() },
        }),
        locale: "en",
      });

      const excludedRow = data!.utxoRows.find(r => r.rowKey === "b-0");
      expect(excludedRow?.disabled).toBe(false);
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
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [{ hash: "x", outputIndex: 0 }],
        },
      }) as BtcTransaction;

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
        displayData: makeDisplayData([
          {
            rowKey: "x-0",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ]),
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
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [],
        },
      }) as BtcTransaction;

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData: makeDisplayData([
          {
            rowKey: "dead-beef-0",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
          {
            rowKey: "invalid-key",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ]),
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
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [{ hash: "old", outputIndex: 1 }],
        },
      }) as BtcTransaction;

      const patch = buildStrategyChangePatch({
        transaction: tx,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData: null,
      });

      expect((patch!.utxoStrategy as { excludeUTXOs: unknown[] }).excludeUTXOs).toEqual([]);
    });
  });

  describe("buildToggleRowExclusionPatch", () => {
    it("should return null when strategy is not CUSTOM", () => {
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [],
        },
      }) as BtcTransaction;

      expect(
        buildToggleRowExclusionPatch({
          transaction: tx,
          rowKey: "a-0",
          displayData: makeDisplayData([]),
        }),
      ).toBeNull();
    });

    it("should return null when row is disabled", () => {
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [],
        },
      }) as BtcTransaction;

      expect(
        buildToggleRowExclusionPatch({
          transaction: tx,
          rowKey: "a-0",
          displayData: makeDisplayData([
            {
              rowKey: "a-0",
              titleLabel: "",
              formattedValue: "",
              excluded: false,
              exclusionReason: undefined,
              isUsedInTx: false,
              unconfirmed: true,
              disabled: true,
              confirmations: 0,
            },
          ]),
        }),
      ).toBeNull();
    });

    it("should add UTXO to excludeUTXOs when row is not excluded", () => {
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [],
        },
      }) as BtcTransaction;

      const patch = buildToggleRowExclusionPatch({
        transaction: tx,
        rowKey: "abc-1",
        displayData: makeDisplayData([
          {
            rowKey: "abc-1",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ]),
      });

      expect(patch).toEqual({
        utxoStrategy: {
          ...tx.utxoStrategy,
          excludeUTXOs: [{ hash: "abc", outputIndex: 1 }],
        },
      });
    });

    it("should remove UTXO from excludeUTXOs when row is excluded", () => {
      const tx = makeTransaction({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [
            { hash: "abc", outputIndex: 1 },
            { hash: "keep", outputIndex: 0 },
          ],
        },
      }) as BtcTransaction;

      const patch = buildToggleRowExclusionPatch({
        transaction: tx,
        rowKey: "abc-1",
        displayData: makeDisplayData([
          {
            rowKey: "abc-1",
            titleLabel: "",
            formattedValue: "",
            excluded: true,
            exclusionReason: "userExclusion",
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ]),
      });

      expect(
        (patch!.utxoStrategy as { excludeUTXOs: { hash: string; outputIndex: number }[] })
          .excludeUTXOs,
      ).toEqual([{ hash: "keep", outputIndex: 0 }]);
    });
  });

  describe("customStrategyValue", () => {
    it("should match bitcoinPickingStrategy.CUSTOM", () => {
      expect(customStrategyValue).toBe(bitcoinPickingStrategy.CUSTOM);
    });
  });
});

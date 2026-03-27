/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import type { CoinControlDisplayData } from "../../../bridge/descriptor/types";
import { bitcoinCoinControlConfig, parseBitcoinRowKey } from "./coinControl";
import { bitcoinPickingStrategy } from "../types";

describe("bitcoinCoinControlConfig", () => {
  describe("parseBitcoinRowKey", () => {
    it("parses hash and output index", () => {
      expect(parseBitcoinRowKey("abcd-0")).toEqual({ hash: "abcd", outputIndex: 0 });
      expect(parseBitcoinRowKey("deadbeef-12")).toEqual({ hash: "deadbeef", outputIndex: 12 });
    });

    it("returns null for invalid input", () => {
      expect(parseBitcoinRowKey("nodash")).toBeNull();
      expect(parseBitcoinRowKey("-1")).toBeNull();
    });
  });

  describe("buildStrategyChangePatch", () => {
    it("sets excludeUTXOs from row keys when switching to CUSTOM", () => {
      const transaction = {
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [] as { hash: string; outputIndex: number }[],
        },
      };
      const displayData: CoinControlDisplayData = {
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 0,
        totalSpent: new BigNumber(0),
        utxoRows: [
          {
            rowKey: "aa-0",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ],
      };

      const patch = bitcoinCoinControlConfig.buildStrategyChangePatch({
        transaction,
        strategy: bitcoinPickingStrategy.CUSTOM,
        displayData,
      });

      expect(patch).toEqual({
        utxoStrategy: {
          ...transaction.utxoStrategy,
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [{ hash: "aa", outputIndex: 0 }],
        },
      });
    });

    it("clears excludeUTXOs when leaving CUSTOM", () => {
      const transaction = {
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [{ hash: "x", outputIndex: 1 }],
        },
      };

      const patch = bitcoinCoinControlConfig.buildStrategyChangePatch({
        transaction,
        strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
        displayData: null,
      });

      expect(patch).toEqual({
        utxoStrategy: {
          ...transaction.utxoStrategy,
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [],
        },
      });
    });
  });

  describe("buildToggleRowExclusionPatch", () => {
    it("adds UTXO to exclude list when not excluded", () => {
      const transaction = {
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.CUSTOM,
          excludeUTXOs: [] as { hash: string; outputIndex: number }[],
        },
      };
      const displayData: CoinControlDisplayData = {
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 0,
        totalSpent: new BigNumber(0),
        utxoRows: [
          {
            rowKey: "h1-2",
            titleLabel: "",
            formattedValue: "",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 0,
          },
        ],
      };

      const patch = bitcoinCoinControlConfig.buildToggleRowExclusionPatch({
        transaction,
        rowKey: "h1-2",
        displayData,
      });

      expect(patch).toEqual({
        utxoStrategy: {
          ...transaction.utxoStrategy,
          excludeUTXOs: [{ hash: "h1", outputIndex: 2 }],
        },
      });
    });
  });
});

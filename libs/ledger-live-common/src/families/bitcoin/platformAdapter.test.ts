import btc from "./platformAdapter";
import { BitcoinTransaction as PlatformTransaction, FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import type { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for BTC platform tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: PlatformTransaction = {
        family: FAMILIES.BITCOIN,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "bitcoin",
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        btc.getPlatformTransactionSignFlowInfos(btcPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided, the fee rate moves to familySpecificData", () => {
      const btcPlatformTx: PlatformTransaction = {
        family: FAMILIES.BITCOIN,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        feePerByte: new BigNumber(300),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "bitcoin",
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
        familySpecificData: { feePerByte: "300" },
        feesStrategy: null,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        btc.getPlatformTransactionSignFlowInfos(btcPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
      expect(liveTx).not.toHaveProperty("feePerByte");
    });
  });
});

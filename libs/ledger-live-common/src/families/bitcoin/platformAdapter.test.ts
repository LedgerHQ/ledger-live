import btc from "./platformAdapter";
import { BitcoinTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for BTC platform tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: PlatformTransaction = {
        family: FAMILIES.BITCOIN,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: btcPlatformTx.family,
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        btc.getPlatformTransactionSignFlowInfos(btcPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
      const btcPlatformTx: PlatformTransaction = {
        family: FAMILIES.BITCOIN,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        feePerByte: new BigNumber(300),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: btcPlatformTx.family,
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
        feePerByte: btcPlatformTx.feePerByte,
        feesStrategy: null,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        btc.getPlatformTransactionSignFlowInfos(btcPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

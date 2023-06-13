import btc from "./walletApiAdapter";
import { BitcoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  const dummyAccount = {} as Account;

  describe("should properly get infos for BTC platform tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: btcPlatformTx.family,
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        tx: btcPlatformTx,
        account: dummyAccount,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
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

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        tx: btcPlatformTx,
        account: dummyAccount,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

import btc from "./walletApiAdapter";
import { FilecoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for BTC platform tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "filecoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: btcPlatformTx.family,
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
      };

      const { hasFeesProvided, liveTx } =
        btc.getWalletAPITransactionSignFlowInfos(btcPlatformTx);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "filecoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: btcPlatformTx.family,
        amount: btcPlatformTx.amount,
        recipient: btcPlatformTx.recipient,
        feesStrategy: null,
      };

      const { hasFeesProvided, liveTx } =
        btc.getWalletAPITransactionSignFlowInfos(btcPlatformTx);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

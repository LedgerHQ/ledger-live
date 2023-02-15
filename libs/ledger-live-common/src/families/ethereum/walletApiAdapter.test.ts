import eth from "./walletApiAdapter";
import { EthereumTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for ETH platform tx", () => {
    test("without fees provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: ethPlatformTx.family,
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        eth.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasPrice: new BigNumber(300),
        gasLimit: new BigNumber(21000),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: ethPlatformTx.family,
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        gasPrice: ethPlatformTx.gasPrice,
        userGasLimit: ethPlatformTx.gasLimit,
        feesStrategy: "custom",
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        eth.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

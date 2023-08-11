import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { EthereumTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import evm from "./walletApiAdapter";

// FIXME: add tests for tx of type 2

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for ETH platform tx", () => {
    test("without fees provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        data: undefined,
        gasLimit: undefined,
        nonce: undefined,
        type: 0,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

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
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        gasPrice: ethPlatformTx.gasPrice,
        gasLimit: ethPlatformTx.gasLimit,
        customGasLimit: ethPlatformTx.gasLimit,
        nonce: undefined,
        data: undefined,
        feesStrategy: "custom",
        type: 0,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

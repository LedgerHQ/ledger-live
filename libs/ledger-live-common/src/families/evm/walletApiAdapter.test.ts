import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { EthereumTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import evm from "./walletApiAdapter";

describe("getWalletAPITransactionSignFlowInfos", () => {
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
        customGasLimit: undefined,
        feesStrategy: "medium",
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided for legacy tx", () => {
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

    test("with fees provided for eip1559 tx", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasLimit: new BigNumber(21000),
        maxFeePerGas: new BigNumber(300),
        maxPriorityFeePerGas: new BigNumber(200),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        gasLimit: ethPlatformTx.gasLimit,
        customGasLimit: ethPlatformTx.gasLimit,
        maxFeePerGas: ethPlatformTx.maxFeePerGas,
        maxPriorityFeePerGas: ethPlatformTx.maxPriorityFeePerGas,
        nonce: undefined,
        data: undefined,
        feesStrategy: "custom",
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with only gasLimit provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasLimit: new BigNumber(21000),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        gasLimit: ethPlatformTx.gasLimit,
        customGasLimit: ethPlatformTx.gasLimit,
        feesStrategy: "medium",
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        nonce: undefined,
        data: undefined,
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getWalletAPITransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

import { DEFAULT_NONCE } from "@ledgerhq/coin-evm/createTransaction";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { FAMILIES, EthereumTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import evm from "./platformAdapter";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for ETH platform tx", () => {
    test("without fees provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        data: undefined,
        gasLimit: undefined,
        nonce: DEFAULT_NONCE,
        customGasLimit: undefined,
        feesStrategy: undefined,
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    // FIXME: add tests for tx of type 2
    test("with fees provided for legacy tx", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
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
        nonce: DEFAULT_NONCE,
        data: undefined,
        feesStrategy: "custom",
        type: 0,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with only gasLimit provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
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
        nonce: DEFAULT_NONCE,
        data: undefined,
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with nonce provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        nonce: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: "evm",
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        data: undefined,
        gasLimit: undefined,
        nonce: 1,
        customGasLimit: undefined,
        feesStrategy: undefined,
        type: 2,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        evm.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

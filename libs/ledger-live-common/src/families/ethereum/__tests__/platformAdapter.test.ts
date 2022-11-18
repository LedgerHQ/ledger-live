import eth from "../platformAdapter";
import { EthereumTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for ETH platform tx", () => {
    it("without fees provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: ethPlatformTx.family,
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        eth.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with fees provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasPrice: new BigNumber(15),
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
        eth.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with only gasPrice provided", () => {
      const ethPlatformTx: PlatformTransaction = {
        family: FAMILIES.ETHEREUM,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasPrice: new BigNumber(15),
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: ethPlatformTx.family,
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        gasPrice: ethPlatformTx.gasPrice,
        feesStrategy: "custom",
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        eth.getPlatformTransactionSignFlowInfos(ethPlatformTx);

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
        family: ethPlatformTx.family,
        amount: ethPlatformTx.amount,
        recipient: ethPlatformTx.recipient,
        userGasLimit: ethPlatformTx.gasLimit,
        feesStrategy: "custom",
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        eth.getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

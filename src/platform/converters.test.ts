import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getPlatformTransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../types";
import type { PlatformTransaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for ETH platform tx", () => {
    test("without fees provided", () => {
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
        getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
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
        getPlatformTransactionSignFlowInfos(ethPlatformTx);

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
        getPlatformTransactionSignFlowInfos(ethPlatformTx);

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
        getPlatformTransactionSignFlowInfos(ethPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });

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
        getPlatformTransactionSignFlowInfos(btcPlatformTx);

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
        getPlatformTransactionSignFlowInfos(btcPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });

  describe("should properly get infos for XRP platform tx", () => {
    test("without fees provided", () => {
      const xrpPlatformTx: PlatformTransaction = {
        family: FAMILIES.RIPPLE,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        getPlatformTransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with fees provided", () => {
      const xrpPlatformTx: PlatformTransaction = {
        family: FAMILIES.RIPPLE,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        fee: new BigNumber(300),
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        getPlatformTransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });

  describe("should properly get infos for DOT platform tx", () => {
    test("with most basic tx", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: FAMILIES.POLKADOT,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: dotPlatformTx.family,
        amount: dotPlatformTx.amount,
        recipient: dotPlatformTx.recipient,
        mode: dotPlatformTx.mode,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        getPlatformTransactionSignFlowInfos(dotPlatformTx);

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    test("with era provided", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: FAMILIES.POLKADOT,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
        era: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        family: dotPlatformTx.family,
        amount: dotPlatformTx.amount,
        recipient: dotPlatformTx.recipient,
        mode: dotPlatformTx.mode,
        era: `${dotPlatformTx.era}`,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        getPlatformTransactionSignFlowInfos(dotPlatformTx);

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });

  /**
   * FIXME: if we go through with this implementation, need to find a smart / generic way to test each crypto
   * Here is a pseudo code of a solution using some sort of transaction factory
   */

  //   Object.values(FAMILIES)
  //     .filter(
  //       (family) =>
  //         ![
  //           FAMILIES.BITCOIN,
  //           FAMILIES.ETHEREUM,
  //           FAMILIES.RIPPLE,
  //           FAMILIES.POLKADOT,
  //         ].includes(family)
  //     )
  //     .forEach((family) => {
  //       describe(`should properly get infos for ${family} platform tx`, () => {
  //         test("with most basic tx", () => {
  //           const platformTx = platformTxFactory.new(family);
  //           const expectedLiveTx = txFactory.new(family);

  //           const { canEditFees, hasFeesProvided, liveTx } =
  //             getPlatformTransactionSignFlowInfos(platformTx);

  //           expect(canEditFees).toBe(false);

  //           expect(hasFeesProvided).toBe(false);

  //           expect(liveTx).toEqual(expectedLiveTx);
  //         });
  //       });
  //     });
});

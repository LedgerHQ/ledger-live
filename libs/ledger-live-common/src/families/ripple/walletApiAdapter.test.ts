import { RippleTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import xrp from "./walletApiAdapter";
import { Transaction } from "./types";

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for XRP platform tx", () => {
    it("without fees provided", () => {
      const xrpPlatformTx: WalletAPITransaction = {
        family: "ripple",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        xrp.getWalletAPITransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with fees provided", () => {
      const xrpPlatformTx: WalletAPITransaction = {
        family: "ripple",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        fee: new BigNumber(300),
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        xrp.getWalletAPITransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

import BigNumber from "bignumber.js";
import { FAMILIES } from "@ledgerhq/live-app-sdk";
import { RippleTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "@ledgerhq/coin-xrp/types";
import xrp from "./platformAdapter";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for XRP platform tx", () => {
    it("without fees provided", () => {
      const xrpPlatformTx: PlatformTransaction = {
        family: FAMILIES.RIPPLE,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
        family: "xrp",
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        xrp.getPlatformTransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with fees provided", () => {
      const xrpPlatformTx: PlatformTransaction = {
        family: FAMILIES.RIPPLE,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        fee: new BigNumber(300),
        tag: 1,
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...xrpPlatformTx,
        family: "xrp",
      };

      const { canEditFees, hasFeesProvided, liveTx } =
        xrp.getPlatformTransactionSignFlowInfos(xrpPlatformTx);

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

import dot from "./platformAdapter";
import { PolkadotTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for DOT platform tx", () => {
    it("with most basic tx", () => {
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
        dot.getPlatformTransactionSignFlowInfos(dotPlatformTx);

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with era provided", () => {
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
        dot.getPlatformTransactionSignFlowInfos(dotPlatformTx);

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

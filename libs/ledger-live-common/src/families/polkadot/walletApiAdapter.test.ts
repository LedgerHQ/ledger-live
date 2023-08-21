import { Account } from "@ledgerhq/types-live";
import { PolkadotTransaction as PlatformTransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "@ledgerhq/coin-polkadot/types";
import BigNumber from "bignumber.js";
import dot from "./walletApiAdapter";

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for DOT platform tx", () => {
    const dummyAccount = {} as Account;

    it("with most basic tx", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
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

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        tx: dotPlatformTx,
        account: dummyAccount,
      });

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with era provided", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
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

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        tx: dotPlatformTx,
        account: dummyAccount,
      });

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

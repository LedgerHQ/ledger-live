import { Account } from "@ledgerhq/types-live";
import { PolkadotTransaction as PlatformTransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import dot from "./walletApiAdapter";

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for DOT platform tx", () => {
    it("with most basic tx", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
      };

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: dotPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "era": null,
  "family": "polkadot",
  "fees": null,
  "mode": "send",
  "numSlashingSpans": 0,
  "recipient": "0xABCDEF",
  "rewardDestination": null,
  "useAllAmount": false,
  "validators": Array [],
}
`);
    });

    it("with era provided", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
        era: 1,
      };

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: dotPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "era": "1",
  "family": "polkadot",
  "fees": null,
  "mode": "send",
  "numSlashingSpans": 0,
  "recipient": "0xABCDEF",
  "rewardDestination": null,
  "useAllAmount": false,
  "validators": Array [],
}
`);
    });

    it("with mode provided", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "bond",
      };

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: dotPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "era": null,
  "family": "polkadot",
  "fees": null,
  "mode": "bond",
  "numSlashingSpans": 0,
  "recipient": "0xABCDEF",
  "rewardDestination": null,
  "useAllAmount": false,
  "validators": Array [],
}
`);
    });

    it("with fees provided", () => {
      const dotPlatformTx: PlatformTransaction = {
        family: "polkadot",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
        fee: new BigNumber(300),
      };

      const { canEditFees, hasFeesProvided, liveTx } = dot.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: dotPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "era": null,
  "family": "polkadot",
  "fees": "300",
  "feesStrategy": null,
  "mode": "send",
  "numSlashingSpans": 0,
  "recipient": "0xABCDEF",
  "rewardDestination": null,
  "useAllAmount": false,
  "validators": Array [],
}
`);
    });
  });
});

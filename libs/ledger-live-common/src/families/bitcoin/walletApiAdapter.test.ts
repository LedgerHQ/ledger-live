import { Account } from "@ledgerhq/types-live";
import { BitcoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import btc from "./walletApiAdapter";

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for BTC platform tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "family": "bitcoin",
  "feePerByte": null,
  "feesStrategy": "medium",
  "networkInfo": null,
  "rbf": false,
  "recipient": "0xABCDEF",
  "useAllAmount": false,
  "utxoStrategy": Object {
    "excludeUTXOs": Array [],
    "strategy": 0,
  },
}
`);
    });

    test("with fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        feePerByte: new BigNumber(300),
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "family": "bitcoin",
  "feePerByte": "300",
  "feesStrategy": null,
  "networkInfo": null,
  "rbf": false,
  "recipient": "0xABCDEF",
  "useAllAmount": false,
  "utxoStrategy": Object {
    "excludeUTXOs": Array [],
    "strategy": 0,
  },
}
`);
    });

    test("with opReturnData provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        opReturnData: Buffer.from("hello world"),
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "family": "bitcoin",
  "feePerByte": null,
  "feesStrategy": "medium",
  "networkInfo": null,
  "opReturnData": Object {
    "data": Array [
      104,
      101,
      108,
      108,
      111,
      32,
      119,
      111,
      114,
      108,
      100,
    ],
    "type": "Buffer",
  },
  "rbf": false,
  "recipient": "0xABCDEF",
  "useAllAmount": false,
  "utxoStrategy": Object {
    "excludeUTXOs": Array [],
    "strategy": 0,
  },
}
`);
    });
  });
});

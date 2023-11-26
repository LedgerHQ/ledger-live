import { Account } from "@ledgerhq/types-live";
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

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "family": "evm",
  "feesStrategy": "medium",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });

    test("with fees provided for legacy tx", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasPrice: new BigNumber(300),
        gasLimit: new BigNumber(21000),
      };

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "customGasLimit": "21000",
  "family": "evm",
  "feesStrategy": "custom",
  "gasLimit": "21000",
  "gasPrice": "300",
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 0,
  "useAllAmount": false,
}
`);
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

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "customGasLimit": "21000",
  "family": "evm",
  "feesStrategy": "custom",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": "300",
  "maxPriorityFeePerGas": "200",
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });

    test("with only gasLimit provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        gasLimit: new BigNumber(21000),
      };

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "customGasLimit": "21000",
  "family": "evm",
  "feesStrategy": "medium",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });

    test("with nonce provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        nonce: 1,
      };

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "family": "evm",
  "feesStrategy": "medium",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": 1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });

    test("with data provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        data: Buffer.from("testBufferString"),
      };

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 0,
  "data": Object {
    "data": Array [
      116,
      101,
      115,
      116,
      66,
      117,
      102,
      102,
      101,
      114,
      83,
      116,
      114,
      105,
      110,
      103,
    ],
    "type": "Buffer",
  },
  "family": "evm",
  "feesStrategy": "medium",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });

    test("with account (chainId) provided", () => {
      const ethPlatformTx: WalletAPITransaction = {
        family: "ethereum",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const { canEditFees, hasFeesProvided, liveTx } = evm.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: ethPlatformTx,
        account: { currency: { ethereumLikeInfo: { chainId: 1 } } } as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toMatchInlineSnapshot(`
Object {
  "amount": "100000",
  "chainId": 1,
  "family": "evm",
  "feesStrategy": "medium",
  "gasLimit": "21000",
  "gasPrice": undefined,
  "maxFeePerGas": undefined,
  "maxPriorityFeePerGas": undefined,
  "mode": "send",
  "nonce": -1,
  "recipient": "0xABCDEF",
  "type": 2,
  "useAllAmount": false,
}
`);
    });
  });
});

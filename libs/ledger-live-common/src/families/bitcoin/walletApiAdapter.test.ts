import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import btc from "./walletApiAdapter";

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("bitcoin"),
} as unknown as Account;

const defaultLiveTx = {
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "",
  fees: null,
  useAllAmount: false,
  mode: "send",
  feesStrategy: "medium",
  nonce: new BigNumber(0),
  familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] } },
};

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for BTC wallet API tx", () => {
    test("without fees provided", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual({
        ...defaultLiveTx,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
      });
    });

    test("with fees provided, the rate goes to familySpecificData and no preset applies", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        feePerByte: new BigNumber(300),
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual({
        ...defaultLiveTx,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        feesStrategy: null,
        familySpecificData: {
          utxoStrategy: { strategy: 0, excludeUTXOs: [] },
          feePerByte: "300",
        },
      });
      expect(liveTx).not.toHaveProperty("feePerByte");
    });

    test("with opReturnData provided, it is hex encoded in familySpecificData", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        opReturnData: Buffer.from("hello world"),
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual({
        ...defaultLiveTx,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        familySpecificData: {
          utxoStrategy: { strategy: 0, excludeUTXOs: [] },
          opReturnData: "68656c6c6f20776f726c64",
        },
      });
      expect(liveTx).not.toHaveProperty("opReturnData");
    });

    test("with changeAddress provided, it goes to familySpecificData", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        changeAddress: "1ChangeAddressExample",
      };

      const { canEditFees, hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual({
        ...defaultLiveTx,
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        familySpecificData: {
          utxoStrategy: { strategy: 0, excludeUTXOs: [] },
          changeAddress: "1ChangeAddressExample",
        },
      });
      expect(liveTx).not.toHaveProperty("changeAddress");
    });

    test("with every bitcoin field provided at once", () => {
      const btcPlatformTx: WalletAPITransaction = {
        family: "bitcoin",
        amount: new BigNumber(42),
        recipient: "bc1qrecipient",
        feePerByte: new BigNumber("2.5"),
        opReturnData: Buffer.from([0xde, 0xad]),
        changeAddress: "bc1qchange",
      };

      const { hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(hasFeesProvided).toBe(true);
      expect(liveTx.familySpecificData).toEqual({
        utxoStrategy: { strategy: 0, excludeUTXOs: [] },
        feePerByte: "2.5",
        opReturnData: "dead",
        changeAddress: "bc1qchange",
      });
      expect(liveTx.feesStrategy).toBeNull();
    });

    test("without amount nor recipient, keeps the defaults of the created transaction", () => {
      const btcPlatformTx = {
        family: "bitcoin",
        recipient: "",
      } as unknown as WalletAPITransaction;

      const { hasFeesProvided, liveTx } = btc.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: btcPlatformTx,
        account,
      });

      expect(hasFeesProvided).toBe(false);
      expect(liveTx).toEqual(defaultLiveTx);
    });
  });
});

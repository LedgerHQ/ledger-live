import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { findCryptoCurrencyById } from "../../../currencies";
import { transactionToEthersTransaction } from "../adapters";
import { makeAccount } from "../testUtils";
import * as API from "../api/rpc.common";
import {
  fromTransactionRaw,
  toTransactionRaw,
  transactionToUnsignedTransaction,
} from "../transaction";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  EvmTransactionEIP1559Raw,
  EvmTransactionLegacyRaw,
} from "../types";

const testData = Buffer.from("testBufferString").toString("hex");
const currency = findCryptoCurrencyById("ethereum")!;
const fakeAccount = makeAccount("0xBob", currency);
const rawEip1559Tx: EvmTransactionEIP1559Raw = {
  amount: "100",
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: "21000",
  chainId: 1,
  data: testData,
  maxFeePerGas: "10000",
  maxPriorityFeePerGas: "10000",
  type: 2,
};
const eip1559Tx: EvmTransactionEIP1559 = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  maxFeePerGas: new BigNumber(10000),
  maxPriorityFeePerGas: new BigNumber(10000),
  type: 2,
};
const rawLegacyTx: EvmTransactionLegacyRaw = {
  amount: "100",
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: "21000",
  chainId: 1,
  data: testData,
  gasPrice: "10000",
  type: 0,
};
const legacyTx: EvmTransactionLegacy = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  gasPrice: new BigNumber(10000),
  type: 0,
};

describe("EVM Family", () => {
  describe("transaction.ts", () => {
    describe("fromTransactionRaw", () => {
      it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(rawEip1559Tx)).toEqual(eip1559Tx);
      });

      it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw(rawLegacyTx)).toEqual(legacyTx);
      });
    });

    describe("toTransaction", () => {
      it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
        expect(toTransactionRaw(eip1559Tx)).toEqual(rawEip1559Tx);
      });

      it("should serialize a ledger live legacy transaction into a raw transaction", () => {
        expect(toTransactionRaw(legacyTx)).toEqual(rawLegacyTx);
      });
    });

    describe("transactionToEthersTransaction", () => {
      it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
        const ethers1559Tx: ethers.Transaction = {
          from: "0xBob",
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 2,
          maxFeePerGas: ethers.BigNumber.from(10000),
          maxPriorityFeePerGas: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(eip1559Tx, fakeAccount)).toEqual(
          ethers1559Tx
        );
      });

      it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
        const legacyEthersTx: ethers.Transaction = {
          from: "0xBob",
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 0,
          gasPrice: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(legacyTx, fakeAccount)).toEqual(
          legacyEthersTx
        );
      });
    });

    describe("transactionToUnsignedTransaction", () => {
      it("should create an unsigned version of a ledger live transaction", async () => {
        jest
          .spyOn(API, "getTransactionCount")
          .mockReturnValue(Promise.resolve(69));

        const unsignedTransaction = await transactionToUnsignedTransaction(
          fakeAccount as any,
          legacyTx
        );
        expect(unsignedTransaction).toEqual({
          ...legacyTx,
          nonce: 69,
        });

        jest.restoreAllMocks();
      });
    });
  });
});

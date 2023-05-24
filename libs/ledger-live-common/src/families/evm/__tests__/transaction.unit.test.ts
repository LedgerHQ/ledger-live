import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { transactionToEthersTransaction } from "../adapters";
import { Transaction as EvmTransaction } from "../types";
import * as rpcAPI from "../api/rpc.common";
import {
  fromTransactionRaw,
  getSerializedTransaction,
  toTransactionRaw,
} from "../transaction";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  EvmTransactionEIP1559Raw,
  EvmTransactionLegacyRaw,
} from "../types";

const testData = Buffer.from("testBufferString").toString("hex");
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
  additionalFees: "420",
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
  additionalFees: new BigNumber(420),
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
  additionalFees: "420",
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
  additionalFees: new BigNumber(420),
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

        expect(transactionToEthersTransaction(eip1559Tx)).toEqual(ethers1559Tx);
      });

      it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
        const legacyEthersTx: ethers.Transaction = {
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 0,
          gasPrice: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(legacyTx)).toEqual(
          legacyEthersTx
        );
      });
    });

    describe("getSerializedTransaction", () => {
      beforeAll(() => {
        jest
          .spyOn(rpcAPI, "getTransactionCount")
          .mockImplementation(() => Promise.resolve(0));
      });

      it("should serialize a type 0 transaction", async () => {
        const transactionLegacy: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(21000),
          chainId: 1,
          gasPrice: new BigNumber(100),
          type: 0,
        };
        const serializedTx = await getSerializedTransaction(transactionLegacy);

        expect(serializedTx).toBe(
          "0xdf8064825208946775e49108cb77cda06fc3bef51bcd497602ad886480018080"
        );
      });

      it("should serialize a type 2 transaction", async () => {
        const transactionEIP1559: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(21000),
          chainId: 1,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const serializedTx = await getSerializedTransaction(transactionEIP1559);

        expect(serializedTx).toBe(
          "0x02df01806464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c0"
        );
      });
    });
  });
});

import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";
import { DEFAULT_NONCE } from "../utils";
import { transactionToEthersTransaction } from "./ethers";

const testData = Buffer.from("testBufferString").toString("hex");
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
  describe("adapters", () => {
    describe("ethers", () => {
      describe("transactionToEthersTransaction", () => {
        it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
          const ethers1559Tx: ethers.TransactionLike = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: 21000n,
            data: "0x" + testData,
            value: 100n,
            chainId: 1n,
            type: 2,
            maxFeePerGas: 10000n,
            maxPriorityFeePerGas: 10000n,
          };

          expect(transactionToEthersTransaction(eip1559Tx)).toEqual(ethers1559Tx);
        });

        it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
          const legacyEthersTx: ethers.TransactionLike = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: 21000n,
            data: "0x" + testData,
            value: 100n,
            chainId: 1n,
            type: 0,
            gasPrice: 10000n,
          };

          expect(transactionToEthersTransaction(legacyTx)).toEqual(legacyEthersTx);
        });

        it("should properly handle floating point numbers", () => {
          const txWithFloatingPoint = {
            ...eip1559Tx,
            maxFeePerGas: new BigNumber("29625091714.5"),
          };

          const ethers1559Tx: ethers.TransactionLike = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: 21000n,
            data: "0x" + testData,
            value: 100n,
            chainId: 1n,
            type: 2,
            maxFeePerGas: 29625091715n,
            maxPriorityFeePerGas: 10000n,
          };

          expect(transactionToEthersTransaction(txWithFloatingPoint)).toEqual(ethers1559Tx);
        });

        it("should replace the usage of DEFAULT_NONCE by a valid nonce (but unrealistic) instead", () => {
          const createdTransactionWithDefaultNonce: EvmTransactionLegacy = {
            amount: new BigNumber(100),
            useAllAmount: false,
            subAccountId: "id",
            recipient: "0xkvn",
            feesStrategy: "custom",
            family: "evm",
            mode: "send",
            nonce: DEFAULT_NONCE,
            gasLimit: new BigNumber(21000),
            chainId: 1,
            data: Buffer.from(testData, "hex"),
            gasPrice: new BigNumber(10000),
            type: 0,
          };

          const ethersTxWithUnrealisticNonce: ethers.TransactionLike = {
            to: "0xkvn",
            nonce: Number.MAX_SAFE_INTEGER - 1,
            gasLimit: 21000n,
            data: "0x" + testData,
            value: 100n,
            chainId: 1n,
            type: 0,
            gasPrice: 10000n,
          };

          expect(transactionToEthersTransaction(createdTransactionWithDefaultNonce)).toEqual(
            ethersTxWithUnrealisticNonce,
          );
        });
      });
    });
  });
});

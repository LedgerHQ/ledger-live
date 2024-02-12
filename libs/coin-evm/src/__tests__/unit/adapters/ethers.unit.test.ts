import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { transactionToEthersTransaction } from "../../../adapters";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../../../types";

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

          expect(transactionToEthersTransaction(legacyTx)).toEqual(legacyEthersTx);
        });

        it("should properly handle floating point numbers", () => {
          const txWithFloatingPoint = {
            ...eip1559Tx,
            maxFeePerGas: new BigNumber("29625091714.5"),
          };

          const ethers1559Tx: ethers.Transaction = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: ethers.BigNumber.from(21000),
            data: "0x" + testData,
            value: ethers.BigNumber.from(100),
            chainId: 1,
            type: 2,
            maxFeePerGas: ethers.BigNumber.from("29625091715"),
            maxPriorityFeePerGas: ethers.BigNumber.from(10000),
          };

          expect(transactionToEthersTransaction(txWithFloatingPoint)).toEqual(ethers1559Tx);
        });
      });
    });
  });
});

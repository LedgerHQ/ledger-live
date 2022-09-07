import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "../../../currencies";
import { encodeAccountId } from "../../../account";
import { makeAccount } from "../testUtils";
import {
  EtherscanOperation,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "../types";
import {
  etherscanOperationToOperation,
  transactionToEthersTransaction,
} from "../adapters";

const testData = Buffer.from("testBufferString").toString("hex");
const currency = findCryptoCurrencyById("ethereum")!;
const fakeAccount = makeAccount("0xBob", currency);
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
  describe("adapters.ts", () => {
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

    describe("etherscanOperationToOperation", () => {
      it("should convert an etherscan-like operation (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanOperation = {
          blockNumber: "14923692",
          timeStamp: "1654646570",
          hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
          nonce: "7",
          blockHash:
            "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
          transactionIndex: "27",
          from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
          to: "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc",
          value: "0",
          gas: "6000000",
          gasPrice: "125521409858",
          isError: "0",
          txreceipt_status: "1",
          input:
            "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
          contractAddress: "",
          cumulativeGasUsed: "1977481",
          gasUsed: "57168",
          confirmations: "122471",
          methodId: "0xa9059cbb",
          functionName: "transfer(address _to, uint256 _value)",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
          derivationMode: "",
        });

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-OUT",
          hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
          accountId:
            "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:",
          blockHash:
            "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
          blockHeight: 14923692,
          recipients: ["0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC"],
          senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
          value: new BigNumber(7175807958762144),
          fee: new BigNumber(7175807958762144),
          date: new Date("2022-06-08T00:02:50.000Z"),
          transactionSequenceNumber: 7,
          type: "OUT",
          extra: {},
        };

        expect(
          etherscanOperationToOperation(
            accountId,
            "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            etherscanOp
          )
        ).toEqual(expectedOperation);
      });
    });
  });
});

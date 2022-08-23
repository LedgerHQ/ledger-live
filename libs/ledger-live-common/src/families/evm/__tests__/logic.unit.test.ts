import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeAccountId } from "../../../account";
import {
  eip1559TransactionHasFees,
  etherscanOperationToOperation,
  getEstimatedFees,
  legacyTransactionHasFees,
} from "../logic";
import {
  EtherscanOperation,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "../types";

describe("EVM Family", () => {
  describe("logic.ts", () => {
    describe("legacyTransactionHasFees", () => {
      it("should return true for legacy tx with fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as EvmTransactionLegacy)).toBe(true);
      });

      it("should return false for legacy tx without fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for legacy tx with wrong fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 0,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return true for legacy tx with fees but no type (default being a legacy tx)", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(true);
      });
    });

    describe("eip1559TransactionHasFess", () => {
      it("should return true for 1559 tx with fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(true);
      });

      it("should return false for 1559 tx without fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for 1559 tx with wrong fees", () => {
        const tx: Partial<EvmTransactionLegacy | EvmTransactionEIP1559> = {
          type: 2,
          gasPrice: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });
    });

    describe("getEstimatedFees", () => {
      it("should return the right fee estimation for a legacy tx", () => {
        const tx = {
          type: 0,
          gasLimit: new BigNumber(3),
          gasPrice: new BigNumber(23),
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(40),
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
      });

      it("should return the right fee estimation for a 1559 tx", () => {
        const tx = {
          type: 2,
          gasLimit: new BigNumber(3),
          gasPrice: new BigNumber(23),
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(40),
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
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

import { toErrorRaw } from "@ledgerhq/coin-framework/lib/serialization/transaction";
import BigNumber from "bignumber.js";
import {
  eip1559Tx,
  legacyTx,
  nftEip1559tx,
  nftLegacyTx,
  nftRawLegacyTx,
  rawEip1559Tx,
  rawLegacyTx,
  rawNftEip1559Tx,
} from "./fixtures/transaction.fixtures";
import {
  fromTransactionRaw,
  fromTransactionStatusRaw,
  getTypedTransaction,
  toTransactionRaw,
  toTransactionStatusRaw,
} from "./transaction";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  FeeData,
} from "./types";

jest.mock("./network/node/rpc.common", () => ({
  getTransactionCount: jest.fn(),
}));

describe("EVM Family", () => {
  describe("transaction.ts", () => {
    describe("fromTransactionRaw", () => {
      describe("without customGasLimit", () => {
        it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawEip1559Tx)).toEqual(eip1559Tx);
        });

        it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawLegacyTx)).toEqual(legacyTx);
        });

        it("should deserialize a raw legacy transaction without type into a ledger live transaction", () => {
          expect(
            fromTransactionRaw({
              ...rawLegacyTx,
              type: undefined as any,
            }),
          ).toEqual(legacyTx);
        });

        it("should deserialize an nft legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(nftRawLegacyTx)).toEqual(nftLegacyTx);
        });

        it("should deserialize an nft EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawNftEip1559Tx)).toEqual(nftEip1559tx);
        });
      });
      describe("with customGasLimit", () => {
        it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw({ ...rawEip1559Tx, customGasLimit: "22000" })).toEqual({
            ...eip1559Tx,
            customGasLimit: new BigNumber(22000),
          });
        });

        it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw({ ...rawLegacyTx, customGasLimit: "22000" })).toEqual({
            ...legacyTx,
            customGasLimit: new BigNumber(22000),
          });
        });

        it("should deserialize a raw legacy transaction without type into a ledger live transaction", () => {
          expect(
            fromTransactionRaw({
              ...rawLegacyTx,
              type: undefined as any,
              customGasLimit: "22000",
            }),
          ).toEqual({
            ...legacyTx,
            customGasLimit: new BigNumber(22000),
          });
        });

        it("should deserialize an nft legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw({ ...nftRawLegacyTx, customGasLimit: "22000" })).toEqual({
            ...nftLegacyTx,
            customGasLimit: new BigNumber(22000),
          });
        });

        it("should deserialize an nft EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw({ ...rawNftEip1559Tx, customGasLimit: "22000" })).toEqual({
            ...nftEip1559tx,
            customGasLimit: new BigNumber(22000),
          });
        });
      });
    });

    describe("toTransaction", () => {
      describe("without customGasLimit", () => {
        it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
          expect(toTransactionRaw(eip1559Tx)).toEqual(rawEip1559Tx);
        });

        it("should serialize a ledger live legacy transaction into a raw transaction", () => {
          expect(toTransactionRaw(legacyTx)).toEqual(rawLegacyTx);
        });

        it("should serialize an nft ledger live transaction without type into a raw live transaction", () => {
          expect(toTransactionRaw(nftLegacyTx)).toEqual(nftRawLegacyTx);
        });
      });

      describe("with customGasLimit", () => {
        it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
          expect(toTransactionRaw({ ...eip1559Tx, customGasLimit: new BigNumber(22000) })).toEqual({
            ...rawEip1559Tx,
            customGasLimit: "22000",
          });
        });

        it("should serialize a ledger live legacy transaction into a raw transaction", () => {
          expect(toTransactionRaw({ ...legacyTx, customGasLimit: new BigNumber(22000) })).toEqual({
            ...rawLegacyTx,
            customGasLimit: "22000",
          });
        });

        it("should serialize an nft ledger live transaction without type into a raw live transaction", () => {
          expect(
            toTransactionRaw({ ...nftLegacyTx, customGasLimit: new BigNumber(22000) }),
          ).toEqual({ ...nftRawLegacyTx, customGasLimit: "22000" });
        });
      });
    });

    describe("fromTransactionStatusRaw", () => {
      it("should deserialize an old transaction status without totalFees", () => {
        const err = new Error("Error Message");
        const warn = new Error("Warning Message");
        expect(
          fromTransactionStatusRaw({
            amount: "1",
            errors: { errorName: toErrorRaw(err) },
            warnings: { warningName: toErrorRaw(warn) },
            estimatedFees: "2",
            totalSpent: "4",
            recipientIsReadOnly: false,
          } as any),
        ).toEqual({
          amount: new BigNumber(1),
          errors: { errorName: err },
          warnings: { warningName: warn },
          estimatedFees: new BigNumber(2),
          totalFees: new BigNumber(0),
          totalSpent: new BigNumber(4),
          recipientIsReadOnly: false,
        });
      });
      it("should deserialize a transaction status", () => {
        const err = new Error("Error Message");
        const warn = new Error("Warning Message");
        expect(
          fromTransactionStatusRaw({
            amount: "1",
            errors: { errorName: toErrorRaw(err) },
            warnings: { warningName: toErrorRaw(warn) },
            estimatedFees: "2",
            totalFees: "3",
            totalSpent: "4",
            recipientIsReadOnly: false,
          }),
        ).toEqual({
          amount: new BigNumber(1),
          errors: { errorName: err },
          warnings: { warningName: warn },
          estimatedFees: new BigNumber(2),
          totalFees: new BigNumber(3),
          totalSpent: new BigNumber(4),
          recipientIsReadOnly: false,
        });
      });
    });

    describe("toTransactionStatusRaw", () => {
      it("should serialize a transaction status", () => {
        const err = new Error("Error Message");
        const warn = new Error("Warning Message");
        expect(
          toTransactionStatusRaw({
            amount: new BigNumber(1),
            errors: { errorName: err },
            warnings: { warningName: warn },
            estimatedFees: new BigNumber(2),
            totalFees: new BigNumber(3),
            totalSpent: new BigNumber(4),
            recipientIsReadOnly: false,
          }),
        ).toEqual({
          amount: "1",
          errors: { errorName: toErrorRaw(err) },
          warnings: { warningName: toErrorRaw(warn) },
          estimatedFees: "2",
          totalFees: "3",
          totalSpent: "4",
          recipientIsReadOnly: false,
        });
      });
    });

    describe("getTypedTransaction", () => {
      const getTransactionToType = (type: number): EvmTransaction => {
        if (type === 2) {
          return eip1559Tx;
        }

        return legacyTx;
      };

      describe.each([{ type: "legacy" }, { type: "eip1559" }])(
        `when transaction to type is $type`,
        type => {
          const transactionToType = getTransactionToType(type.type === "eip1559" ? 2 : 0);

          const legacyTransactionsTestCases: Array<{
            description: string;
            feeData: FeeData;
            expectedTransaction: EvmTransactionLegacy;
          }> = [
            {
              description: "only contains `maxFeePerGas`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: null,
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(0),
                type: 0,
              } as any),
            },
            {
              description: "only contains `maxPriorityFeePerGas`",
              feeData: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: new BigNumber(100),
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(0),
                type: 0,
              } as any),
            },
            {
              description: "only contains `gasPrice`",
              feeData: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: null,
                gasPrice: new BigNumber(20000),
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(20000),
                type: 0,
              } as any),
            },
          ];

          describe("should return a type 0 transaction", () => {
            it.each(legacyTransactionsTestCases)(
              `when feeData $description`,
              ({ feeData, expectedTransaction }) => {
                const typedTransaction = getTypedTransaction(transactionToType, feeData);

                expect(typedTransaction).toEqual(expectedTransaction);
              },
            );
          });

          const eip1559TransactionsTestCases: Array<{
            description: string;
            feeData: FeeData;
            expectedTransaction: EvmTransactionEIP1559;
          }> = [
            {
              description: "only contains `maxFeePerGas` and `maxPriorityFeePerGas`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: undefined,
                type: 2,
              } as any),
            },
            {
              description: "contains `maxFeePerGas`, `maxPriorityFeePerGas` and `gasPrice`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: new BigNumber(20000),
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: undefined,
                type: 2,
              } as any),
            },
          ];

          describe("should return a type 2 transaction", () => {
            it.each(eip1559TransactionsTestCases)(
              `when feeData $description`,
              ({ feeData, expectedTransaction }) => {
                const typedTransaction = getTypedTransaction(transactionToType, feeData);

                expect(typedTransaction).toEqual(expectedTransaction);
              },
            );
          });
        },
      );
    });
  });
});

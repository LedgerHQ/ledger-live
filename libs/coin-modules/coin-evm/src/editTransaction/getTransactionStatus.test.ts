import {
  AmountRequired,
  RecipientRequired,
  ReplacementTransactionUnderpriced,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { NotEnoughNftOwned, NotOwnedNft } from "../errors";
import { EvmTransactionEIP1559, EvmTransactionLegacy, TransactionStatus } from "../types";
import { getMinEip1559Fees, getMinLegacyFees } from "./getMinEditTransactionFees";
import { validateEditTransaction, getEditTransactionStatus } from "./getTransactionStatus";

const recipient = "0xe2ca7390e76c5A992749bB622087310d2e63ca29"; // rambo.eth
const testData = Buffer.from("testBufferString").toString("hex");
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const legacyTx: EvmTransactionLegacy = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient,
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  gasPrice: new BigNumber(100),
  type: 0,
};

const eip1559Tx: EvmTransactionEIP1559 = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient,
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
};

describe("EVM Family", () => {
  describe("getTransactionStatus.ts", () => {
    describe("validateEditTransaction", () => {
      describe("Transaction Type: Legacy", () => {
        const updatedLegacyTx: EvmTransactionLegacy = {
          ...legacyTx,
          gasPrice: legacyTx.gasPrice.plus(100),
        };

        describe("when no editType provided", () => {
          it("should not have error or warning", () => {
            const res = validateEditTransaction({
              transaction: updatedLegacyTx,
              transactionToUpdate: legacyTx,
            });

            expect(res.errors).toEqual({});
            expect(res.warnings).toEqual({});
          });
        });

        describe("when no gasPrice provided in original transaction", () => {
          it("should throw error", () => {
            const originalTx: EvmTransactionLegacy = {
              ...legacyTx,
              gasPrice: undefined as any,
            };

            expect(() => {
              validateEditTransaction({
                transaction: updatedLegacyTx,
                transactionToUpdate: originalTx,
                editType: "speedup",
              });
            }).toThrow("gasPrice");
          });
        });

        describe("when no gasPrice provided in updated transaction", () => {
          it("should not have error and warning", () => {
            const invalidUpdatedTx: EvmTransactionLegacy = {
              ...updatedLegacyTx,
              gasPrice: undefined as any,
            };

            const res = validateEditTransaction({
              transaction: invalidUpdatedTx,
              transactionToUpdate: legacyTx,
              editType: "speedup",
            });

            expect(res.errors).toEqual({});
            expect(res.warnings).toEqual({});
          });
        });

        describe("min fees", () => {
          const { gasPrice: minGasPrice } = getMinLegacyFees({ gasPrice: legacyTx.gasPrice });

          const cases = [
            { label: "<", value: minGasPrice.minus(1), hasError: true },
            { label: "=", value: minGasPrice, hasError: false },
            { label: ">", value: minGasPrice.plus(1), hasError: false },
          ];

          describe.each(cases)(
            "when new gasPrice is $label minimum gasPrice",
            ({ value, hasError }) => {
              it(`should ${hasError ? "" : "not"} have error`, () => {
                const newUpdatedLegacyTx: EvmTransactionLegacy = {
                  ...updatedLegacyTx,
                  gasPrice: new BigNumber(value),
                };

                const res = validateEditTransaction({
                  transaction: newUpdatedLegacyTx,
                  transactionToUpdate: legacyTx,
                  editType: "speedup",
                });

                if (hasError) {
                  expect(res.errors).toEqual(
                    expect.objectContaining({
                      replacementTransactionUnderpriced: new ReplacementTransactionUnderpriced(),
                    }),
                  );
                } else {
                  expect(res.errors).toEqual({});
                }
              });
            },
          );
        });
      });
      describe("Transaction Type: EIP1559", () => {
        const updatedEip1559Tx: EvmTransactionEIP1559 = {
          ...eip1559Tx,
          maxFeePerGas: eip1559Tx.maxFeePerGas.plus(100),
          maxPriorityFeePerGas: eip1559Tx.maxPriorityFeePerGas.plus(50),
        };

        describe("when no editType provided", () => {
          it("should not have error or warning", () => {
            const res = validateEditTransaction({
              transaction: updatedEip1559Tx,
              transactionToUpdate: eip1559Tx,
            });

            expect(res.errors).toEqual({});
            expect(res.warnings).toEqual({});
          });
        });

        describe("when no maxFeePerGas provided in original transaction", () => {
          it("should throw error", () => {
            const originalTx: EvmTransactionEIP1559 = {
              ...eip1559Tx,
              maxFeePerGas: undefined as any,
            };

            expect(() => {
              validateEditTransaction({
                transaction: updatedEip1559Tx,
                transactionToUpdate: originalTx,
                editType: "speedup",
              });
            }).toThrow("maxFeePerGas");
          });
        });

        describe("when no maxPriorityFeePerGas provided in original transaction", () => {
          it("should throw error", () => {
            const originalTx: EvmTransactionEIP1559 = {
              ...eip1559Tx,
              maxPriorityFeePerGas: undefined,
            } as any;

            expect(() => {
              validateEditTransaction({
                transaction: updatedEip1559Tx,
                transactionToUpdate: originalTx,
                editType: "speedup",
              });
            }).toThrow("maxPriorityFeePerGas");
          });
        });

        describe("when no maxFeePerGas provided in updated transaction", () => {
          it("should not have error and warning", () => {
            const invalidUpdatedTx: EvmTransactionEIP1559 = {
              ...eip1559Tx,
              maxFeePerGas: undefined,
            } as any;

            const res = validateEditTransaction({
              transaction: invalidUpdatedTx,
              transactionToUpdate: eip1559Tx,
              editType: "speedup",
            });

            expect(res.errors).toEqual({});
            expect(res.warnings).toEqual({});
          });
        });

        describe("when no maxPriorityFeePerGas provided in updated transaction", () => {
          it("should not have error and warning", () => {
            const invalidUpdatedTx: EvmTransactionEIP1559 = {
              ...eip1559Tx,
              maxPriorityFeePerGas: undefined as any,
            };

            const res = validateEditTransaction({
              transaction: invalidUpdatedTx,
              transactionToUpdate: eip1559Tx,
              editType: "speedup",
            });

            expect(res.errors).toEqual({});
            expect(res.warnings).toEqual({});
          });
        });

        describe("min fees", () => {
          const { maxFeePerGas: minMaxFeePerGas, maxPriorityFeePerGas: minMaxPriorityFeePerGas } =
            getMinEip1559Fees({
              maxFeePerGas: eip1559Tx.maxFeePerGas,
              maxPriorityFeePerGas: eip1559Tx.maxPriorityFeePerGas,
            });

          const cases = [
            {
              maxFeePerGas: { label: "<", value: minMaxFeePerGas.minus(1) },
              maxPriorityFeePerGas: { label: "<", value: minMaxPriorityFeePerGas.minus(1) },
              hasError: true,
            },
            {
              maxFeePerGas: { label: "<", value: minMaxFeePerGas.minus(1) },
              maxPriorityFeePerGas: { label: "=", value: minMaxPriorityFeePerGas },
              hasError: true,
            },
            {
              maxFeePerGas: { label: "<", value: minMaxFeePerGas.minus(1) },
              maxPriorityFeePerGas: { label: ">", value: minMaxPriorityFeePerGas.plus(1) },
              hasError: true,
            },
            {
              maxFeePerGas: { label: "=", value: minMaxFeePerGas },
              maxPriorityFeePerGas: { label: "<", value: minMaxPriorityFeePerGas.minus(1) },
              hasError: true,
            },
            {
              maxFeePerGas: { label: "=", value: minMaxFeePerGas },
              maxPriorityFeePerGas: { label: "=", value: minMaxPriorityFeePerGas },
              hasError: false,
            },
            {
              maxFeePerGas: { label: "=", value: minMaxFeePerGas },
              maxPriorityFeePerGas: { label: ">", value: minMaxPriorityFeePerGas.plus(1) },
              hasError: false,
            },
            {
              maxFeePerGas: { label: ">", value: minMaxFeePerGas.plus(1) },
              maxPriorityFeePerGas: { label: "<", value: minMaxPriorityFeePerGas.minus(1) },
              hasError: true,
            },
            {
              maxFeePerGas: { label: ">", value: minMaxFeePerGas.plus(1) },
              maxPriorityFeePerGas: { label: "=", value: minMaxPriorityFeePerGas },
              hasError: false,
            },
            {
              maxFeePerGas: { label: ">", value: minMaxFeePerGas.plus(1) },
              maxPriorityFeePerGas: { label: ">", value: minMaxPriorityFeePerGas.plus(1) },
              hasError: false,
            },
          ];

          describe.each(cases)(
            "when new maxFeePerGas is $maxFeePerGas.label minimum maxFeePerGas and new maxPriorityFeePerGas is $maxPriorityFeePerGas.label minimum maxPriorityFeePerGas",
            ({ maxFeePerGas, maxPriorityFeePerGas, hasError }) => {
              it(`should ${hasError ? "" : "not"} have error`, () => {
                const newUpdatedEip1559Tx: EvmTransactionEIP1559 = {
                  ...updatedEip1559Tx,
                  maxFeePerGas: new BigNumber(maxFeePerGas.value),
                  maxPriorityFeePerGas: new BigNumber(maxPriorityFeePerGas.value),
                };

                const res = validateEditTransaction({
                  transaction: newUpdatedEip1559Tx,
                  transactionToUpdate: eip1559Tx,
                  editType: "speedup",
                });

                if (hasError) {
                  expect(res.errors).toEqual(
                    expect.objectContaining({
                      replacementTransactionUnderpriced: new ReplacementTransactionUnderpriced(),
                    }),
                  );
                } else {
                  expect(res.errors).toEqual({});
                }
              });
            },
          );
        });
      });
    });

    describe("getEditTransactionStatus", () => {
      const originalStatus: TransactionStatus = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(2100000),
        totalFees: new BigNumber(100),
        amount: eip1559Tx.amount,
        totalSpent: new BigNumber(2100000).plus(eip1559Tx.amount),
      };

      const editTxErrors = {
        replacementTransactionUnderpriced: new ReplacementTransactionUnderpriced(),
      };

      // Get the minimum required fees for a valid speedup
      const { maxFeePerGas: minMaxFeePerGas, maxPriorityFeePerGas: minMaxPriorityFeePerGas } =
        getMinEip1559Fees({
          maxFeePerGas: eip1559Tx.maxFeePerGas,
          maxPriorityFeePerGas: eip1559Tx.maxPriorityFeePerGas,
        });

      // Transaction with fees that are NOT 10% higher (triggers validation error)
      const underpricedTx = {
        ...eip1559Tx,
        maxFeePerGas: minMaxFeePerGas.minus(1), // Less than minimum required
        maxPriorityFeePerGas: minMaxPriorityFeePerGas.minus(1),
      };

      // Transaction with fees that ARE at least 10% higher (passes validation)
      const validSpeedupTx = {
        ...eip1559Tx,
        maxFeePerGas: minMaxFeePerGas, // Exactly the minimum required
        maxPriorityFeePerGas: minMaxPriorityFeePerGas,
      };

      describe("when original transaction does not have errors", () => {
        describe("when edit transaction checks return errors", () => {
          it("should add edit transaction checks error to status", () => {
            const res = getEditTransactionStatus({
              transaction: underpricedTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatus,
              editType: "speedup",
            });

            expect(res).toEqual({
              ...originalStatus,
              errors: {
                ...originalStatus.errors,
                ...editTxErrors,
              },
            });
          });
        });

        describe("when edit transaction checks does not return errors", () => {
          it("should not update the status", async () => {
            const res = getEditTransactionStatus({
              transaction: validSpeedupTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatus,
              editType: "speedup",
            });

            expect(res).toEqual(originalStatus);
          });
        });
      });

      describe("when original transaction has errors", () => {
        const originalStatusWithErrors: TransactionStatus = {
          ...originalStatus,
          errors: {
            recipient: new RecipientRequired(),
          },
        };

        describe("when edit transaction checks return errors", () => {
          it("should add edit transaction checks error to status", () => {
            const res = getEditTransactionStatus({
              transaction: underpricedTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatusWithErrors,
              editType: "speedup",
            });

            expect(res).toEqual({
              ...originalStatusWithErrors,
              errors: {
                ...originalStatusWithErrors.errors,
                ...editTxErrors,
              },
            });
          });
        });

        describe("when edit transaction checks does not return errors", () => {
          it("should not update the status", async () => {
            const res = getEditTransactionStatus({
              transaction: validSpeedupTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatusWithErrors,
              editType: "speedup",
            });

            expect(res).toEqual(originalStatusWithErrors);
          });
        });

        describe("when original transaction has amount errors", () => {
          const cases = [
            { name: "ERROR_NOT_OWNED_NFT", error: new NotOwnedNft() },
            { name: "ERROR_NOT_ENOUGH_NFT_OWNED", error: new NotEnoughNftOwned() },
            { name: "ERROR_AMOUNT_REQUIRED", error: new AmountRequired() },
          ];

          describe.each(cases)("when has $name error", ({ error }) => {
            it("should remove the amount error", () => {
              const originalStatusWithAmountError: TransactionStatus = {
                ...originalStatusWithErrors,
                errors: {
                  ...originalStatusWithErrors.errors,
                  amount: error,
                },
              };

              const res = getEditTransactionStatus({
                transaction: validSpeedupTx,
                transactionToUpdate: eip1559Tx,
                status: originalStatusWithAmountError,
                editType: "speedup",
              });

              expect(res).toEqual(originalStatusWithErrors);
            });
          });
        });
      });
    });
  });
});

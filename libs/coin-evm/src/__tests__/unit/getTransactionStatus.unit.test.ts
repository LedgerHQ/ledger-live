import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import {
  AmountRequired,
  ETHAddressNonEIP,
  FeeNotLoaded,
  FeeTooHigh,
  GasLessThanEstimate,
  InvalidAddress,
  MaxFeeTooLow,
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  NotEnoughGas,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
  ReplacementTransactionUnderpriced,
} from "@ledgerhq/errors";
import { ProtoNFT } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import fc from "fast-check";
import { NotEnoughNftOwned, NotOwnedNft, QuantityNeedsToBePositive } from "../../errors";
import * as getTransactionStatusModule from "../../getTransactionStatus";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  GasOptions,
  Transaction,
  TransactionStatus,
} from "../../types";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import {
  getMinEip1559Fees,
  getMinLegacyFees,
} from "../../editTransaction/getMinEditTransactionFees";

const {
  default: getTransactionStatus,
  validateEditTransaction,
  getEditTransactionStatus,
} = getTransactionStatusModule;

const recipient = "0xe2ca7390e76c5A992749bB622087310d2e63ca29"; // rambo.eth
const testData = Buffer.from("testBufferString").toString("hex");
const tokenAccount = makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin"));
const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount]);
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
const erc721Nft: ProtoNFT = {
  contract: "0xNftContract",
  tokenId: "1",
  amount: new BigNumber(1),
  currencyId: account.currency.id,
  id: "doesn't matter",
  standard: "ERC721" as const,
};

const erc1155Nft: ProtoNFT = {
  contract: "0xAnotherNftContract",
  tokenId: "2",
  amount: new BigNumber(2),
  currencyId: account.currency.id,
  id: "still doesn't matter",
  standard: "ERC1155" as const,
};

const gasOptions: GasOptions = {
  slow: {
    maxFeePerGas: new BigNumber(1),
    maxPriorityFeePerGas: new BigNumber(1),
    nextBaseFee: new BigNumber(1),
    gasPrice: null,
  },
  medium: {
    maxFeePerGas: new BigNumber(2),
    maxPriorityFeePerGas: new BigNumber(2),
    nextBaseFee: new BigNumber(2),
    gasPrice: null,
  },
  fast: {
    maxFeePerGas: new BigNumber(3),
    maxPriorityFeePerGas: new BigNumber(3),
    nextBaseFee: new BigNumber(3),
    gasPrice: null,
  },
};

describe("EVM Family", () => {
  describe("getTransactionStatus.ts", () => {
    describe("getTransactionStatus", () => {
      describe("Recipient", () => {
        it("should detect the missing recipient and have an error", async () => {
          const tx = { ...eip1559Tx, recipient: "" };
          const res = await getTransactionStatus(account, tx);
          expect(res.errors).toEqual(
            expect.objectContaining({
              recipient: new RecipientRequired(),
            }),
          );
        });

        it("should detect the incorrect recipient not being an eth address and have an error", async () => {
          const tx = { ...eip1559Tx, recipient: "0xkvn" };
          const res = await getTransactionStatus(account, tx);
          expect(res.errors).toEqual(
            expect.objectContaining({
              recipient: new InvalidAddress("", {
                currencyName: account.currency.name,
              }),
            }),
          );
        });

        it("should detect the recipient being an ICAP and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            recipient: "XE89MW3Y75UITCQ4F53YDKR25UFLB1640YM", // ICAP version of recipient address
          };
          const res = await getTransactionStatus(account, tx);
          expect(res.errors).toEqual(
            expect.objectContaining({
              recipient: new InvalidAddress("", {
                currencyName: account.currency.name,
              }),
            }),
          );
        });

        it("should detect the recipient not being an EIP55 address and have a warning", async () => {
          const tx = { ...eip1559Tx, recipient: recipient.toLowerCase() };
          const res = await getTransactionStatus(account, tx);
          expect(res.warnings).toEqual(
            expect.objectContaining({
              recipient: new ETHAddressNonEIP(),
            }),
          );
        });
      });

      describe("Amount", () => {
        it("should detect tx without amount and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            amount: new BigNumber(0),
            data: undefined,
          };
          const res = await getTransactionStatus(account, tx);

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new AmountRequired(),
            }),
          );
        });

        it("should detect tx without amount but with data and not return error", async () => {
          const tx = {
            ...eip1559Tx,
            amount: new BigNumber(0),
          };
          const res = await getTransactionStatus(
            { ...account, balance: new BigNumber(10000000) },
            tx,
          );

          expect(res.errors).toEqual({});
        });

        it("should detect tx without amount from tokenAccount and return error", async () => {
          const tx = {
            ...eip1559Tx,
            amount: new BigNumber(0),
            subAccountId: tokenAccount.id,
          };
          const res = await getTransactionStatus(
            {
              ...account,
              balance: new BigNumber(10000000),
              subAccounts: [
                {
                  ...tokenAccount,
                  balance: new BigNumber(10),
                },
              ],
            },
            tx,
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new AmountRequired(),
            }),
          );
        });

        it("should detect account not having enough balance for a tx and have an error", async () => {
          const res = await getTransactionStatus(
            { ...account, balance: new BigNumber(0) },
            eip1559Tx,
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new NotEnoughBalance(),
            }),
          );
        });
      });

      describe("Gas", () => {
        describe("Common", () => {
          describe.each([
            { type: "Legacy", defaultTx: legacyTx },
            { type: "EIP1559", defaultTx: eip1559Tx },
          ])("Transaction Type: $type", ({ defaultTx }: { defaultTx: Transaction }) => {
            it("should detect missing fees and have an error", async () => {
              const tx = { ...defaultTx, gasPrice: undefined, maxFeePerGas: undefined };
              const res = await getTransactionStatus(account, tx as any);

              expect(res.errors).toEqual(
                expect.objectContaining({
                  gasPrice: new FeeNotLoaded(),
                }),
              );
            });

            it("should detect a gasLimit = 0 and have an error", async () => {
              const tx: Transaction = { ...defaultTx, gasLimit: new BigNumber(0) };
              const res = await getTransactionStatus(account, tx);

              expect(res.errors).toEqual(
                expect.objectContaining({
                  gasLimit: new FeeNotLoaded(),
                }),
              );
            });

            it("should detect a customGasLimit = 0 and have an error", async () => {
              const tx: Transaction = { ...defaultTx, customGasLimit: new BigNumber(0) };
              const res = await getTransactionStatus(account, tx);

              expect(res.errors).toEqual(
                expect.objectContaining({
                  gasLimit: new FeeNotLoaded(),
                }),
              );
            });

            it("should detect gas being too high for the account balance and have an error", async () => {
              const notEnoughBalanceResponse = await getTransactionStatus(
                { ...account, balance: new BigNumber(2099999) },
                defaultTx,
              );
              const enoughBalanceResponse = await getTransactionStatus(
                { ...account, balance: new BigNumber(2100001) },
                defaultTx,
              );

              expect(notEnoughBalanceResponse.errors).toEqual(
                expect.objectContaining({
                  gasPrice: new NotEnoughGas(),
                }),
              );
              expect(enoughBalanceResponse.errors).not.toEqual(
                expect.objectContaining({
                  gasPrice: new NotEnoughGas(),
                }),
              );
            });

            it("should not detect gas being too high when there is no recipient and have an error", async () => {
              const notEnoughBalanceResponse = await getTransactionStatus(
                { ...account, balance: new BigNumber(2099999) },
                { ...defaultTx, recipient: "" },
              );
              const enoughhBalanceResponse = await getTransactionStatus(
                { ...account, balance: new BigNumber(2100001) },
                { ...defaultTx, recipient: "" },
              );

              expect(notEnoughBalanceResponse.errors).not.toEqual(
                expect.objectContaining({
                  gasPrice: new NotEnoughGas(),
                }),
              );
              expect(enoughhBalanceResponse.errors).not.toEqual(
                expect.objectContaining({
                  gasPrice: new NotEnoughGas(),
                }),
              );
            });

            it("should detect gas limit being too low in a tx and have an error", async () => {
              const tx: Transaction = { ...defaultTx, gasLimit: new BigNumber(20000) }; // min should be 21000
              const res = await getTransactionStatus(account, tx);

              expect(res.errors).toEqual(
                expect.objectContaining({
                  gasLimit: new GasLessThanEstimate(),
                }),
              );
            });

            it("should detect custom gas limit being too low in a tx and have an error", async () => {
              const tx: Transaction = { ...defaultTx, customGasLimit: new BigNumber(20000) }; // min should be 21000
              const res = await getTransactionStatus(account, tx);

              expect(res.errors).toEqual(
                expect.objectContaining({
                  gasLimit: new GasLessThanEstimate(),
                }),
              );
            });

            it("should detect customGasLimit being lower than gasLimit and warn", async () => {
              const response = await getTransactionStatus(account, {
                ...defaultTx,
                customGasLimit: defaultTx.gasLimit.minus(1),
              });

              expect(response.warnings).toEqual(
                expect.objectContaining({
                  gasLimit: new GasLessThanEstimate(),
                }),
              );
            });
          });
        });

        describe("Specific", () => {
          describe("Transaction Type: EIP1559", () => {
            it("should detect a maxPriorityFee = 0 and have an error", async () => {
              const res = await getTransactionStatus(
                { ...account, balance: new BigNumber(2100000) },
                {
                  ...eip1559Tx,
                  maxPriorityFeePerGas: new BigNumber(0),
                },
              );

              expect(res.errors).toEqual(
                expect.objectContaining({
                  maxPriorityFee: new PriorityFeeTooLow(),
                }),
              );
            });

            it("should detect maxFeePerGas being greater than max gasOptions maxFeePerGas and error", async () => {
              const response = await getTransactionStatus(account, {
                ...eip1559Tx,
                gasOptions,
                maxFeePerGas: new BigNumber(5),
              });

              expect(response.errors).toEqual(
                expect.objectContaining({
                  maxPriorityFee: new PriorityFeeHigherThanMaxFee(),
                }),
              );
            });

            it("should detect maxPriorityFeePerGas being greater than max gasOptions maxPriorityFeePerGas and warn", async () => {
              const response = await getTransactionStatus(account, {
                ...eip1559Tx,
                gasOptions,
                maxPriorityFeePerGas: new BigNumber(4),
              });

              expect(response.warnings).toEqual(
                expect.objectContaining({
                  maxPriorityFee: new PriorityFeeTooHigh(),
                }),
              );
            });

            it("should detect maxPriorityFeePerGas being lower than min gasOptions maxPriorityFeePerGas and warn", async () => {
              const response = await getTransactionStatus(account, {
                ...eip1559Tx,
                gasOptions,
                maxPriorityFeePerGas: new BigNumber(0.5),
              });

              expect(response.warnings).toEqual(
                expect.objectContaining({
                  maxPriorityFee: new PriorityFeeTooLow(),
                }),
              );
            });

            it("should detect maxFeePerGas being lower than recommanded next base fee and warn", async () => {
              const response = await getTransactionStatus(account, {
                ...eip1559Tx,
                gasOptions,
                maxFeePerGas: new BigNumber(1),
              });

              expect(response.warnings).toEqual(
                expect.objectContaining({
                  maxFee: new MaxFeeTooLow(),
                }),
              );
            });
          });
        });
      });

      describe("Nft", () => {
        describe("ERC721", () => {
          it("should detect a transaction for an ERC721 nft not owned by the account and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc721" as const,
              nft: {
                collectionName: "",
                contract: erc721Nft.contract,
                tokenId: erc721Nft.tokenId,
                quantity: new BigNumber(1),
              },
            };
            const res = await getTransactionStatus(account, tx);

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new NotOwnedNft(),
              }),
            );
          });

          it("should detect a transaction for an ERC721 nft owned by the account but it does not have enough balance to pay for gas and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc721" as const,
              nft: {
                collectionName: "",
                contract: erc721Nft.contract,
                tokenId: erc721Nft.tokenId,
                quantity: new BigNumber(1),
              },
            };
            const res = await getTransactionStatus({ ...account, nfts: [erc721Nft] }, tx);

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new NotEnoughBalanceInParentAccount(),
                gasPrice: new NotEnoughGas(),
              }),
            );
          });
        });

        describe("ERC1155", () => {
          it("should detect a transaction for an ERC1155 nft not owned by the account and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc1155" as const,
              nft: {
                collectionName: "",
                contract: erc1155Nft.contract,
                tokenId: erc1155Nft.tokenId,
                quantity: new BigNumber(1),
              },
            };
            const res = await getTransactionStatus(account, tx);

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new NotOwnedNft(),
              }),
            );
          });

          it("should detect a transaction for an ERC1155 where the quantity is 0 or below and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc1155" as const,
              nft: {
                collectionName: "",
                contract: erc1155Nft.contract,
                tokenId: erc1155Nft.tokenId,
                quantity: new BigNumber(0),
              },
            };
            const res = await getTransactionStatus(
              {
                ...account,
                nfts: [erc1155Nft],
              },
              tx,
            );

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new QuantityNeedsToBePositive(),
              }),
            );
          });

          it("should detect a transaction for an ERC1155 nft but the account doesn't own enough of it and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc1155" as const,
              nft: {
                collectionName: "",
                contract: erc1155Nft.contract,
                tokenId: erc1155Nft.tokenId,
                quantity: new BigNumber(3),
              },
            };
            const res = await getTransactionStatus(
              {
                ...account,
                nfts: [erc1155Nft],
              },
              tx,
            );

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new NotEnoughNftOwned(),
              }),
            );
          });

          it("should detect a transaction for an ERC1155 nft owned by the account but it does not have enough balance to pay for gas and have an error", async () => {
            const tx = {
              ...eip1559Tx,
              mode: "erc1155" as const,
              nft: {
                collectionName: "",
                contract: erc1155Nft.contract,
                tokenId: erc1155Nft.tokenId,
                quantity: new BigNumber(1),
              },
            };
            const res = await getTransactionStatus(
              {
                ...account,
                nfts: [erc1155Nft],
              },
              tx,
            );

            expect(res.errors).toEqual(
              expect.objectContaining({
                amount: new NotEnoughBalanceInParentAccount(),
                gasPrice: new NotEnoughGas(),
              }),
            );
          });
        });
      });

      describe("Fee Ratio", () => {
        /**
         * Helper function to narrow down the type of transaction and set the
         * specific field depending on the type of transaction
         */
        const specifyTx = ({
          tx,
          specificField,
        }: {
          tx: Transaction;
          specificField: number;
        }): Transaction => {
          if (tx.type === 2) {
            return {
              ...tx,
              maxFeePerGas: new BigNumber(specificField),
            } as EvmTransactionEIP1559;
          } else {
            return {
              ...tx,
              gasPrice: new BigNumber(specificField),
            } as EvmTransactionLegacy;
          }
        };

        describe.each([
          { type: "Legacy", defaultTx: legacyTx },
          { type: "EIP1559", defaultTx: eip1559Tx },
        ])("Transaction Type: $type", ({ defaultTx }: { defaultTx: Transaction }) => {
          describe("when fees are too high compared to the amount (fees are more than 10% of the amount)", () => {
            it("should have a warning", async () => {
              await fc.assert(
                fc.asyncProperty(
                  fc
                    .record({
                      amount: fc.integer({ min: 1 }),
                      gasLimit: fc.integer({ min: 1 }),
                      specificField: fc.integer({ min: 1 }),
                    })
                    .filter(({ amount, gasLimit, specificField }) =>
                      BigNumber(gasLimit)
                        .multipliedBy(BigNumber(specificField))
                        .times(10)
                        .gt(BigNumber(amount)),
                    ),
                  async ({ amount, gasLimit, specificField }) => {
                    const tx: Transaction = specifyTx({
                      tx: {
                        ...defaultTx,
                        amount: new BigNumber(amount),
                        gasLimit: new BigNumber(gasLimit),
                        data: undefined,
                      },
                      specificField,
                    });

                    const res = await getTransactionStatus(account, tx);

                    expect(res.warnings).toEqual(
                      expect.objectContaining({
                        feeTooHigh: new FeeTooHigh(),
                      }),
                    );
                  },
                ),
              );
            });

            /**
             * Note: This is to test the lower bound of the x*y*r=a equation
             * with x = gasPrice, y = gasLimit, a = amount, r = ratio
             * This test would pass for r = 10 but would fail for r = 9
             */
            it("should have a warning for lower bound", async () => {
              const amount = 990;
              const gasLimit = 11;
              const specificField = 10;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                  data: undefined,
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });
          });

          describe("when fees are not too high compared to the amount (fees are less than or equal to 10% of the amount)", () => {
            it("should not have a warning", async () => {
              await fc.assert(
                fc.asyncProperty(
                  fc
                    .record({
                      amount: fc.integer({ min: 1 }),
                      gasLimit: fc.integer({ min: 1 }),
                      specificField: fc.integer({ min: 1 }),
                    })
                    .filter(({ amount, specificField, gasLimit }) =>
                      BigNumber(specificField)
                        .multipliedBy(BigNumber(gasLimit))
                        .times(10)
                        .lt(BigNumber(amount)),
                    ),
                  async ({ amount, specificField, gasLimit }) => {
                    const tx: Transaction = specifyTx({
                      tx: {
                        ...defaultTx,
                        amount: new BigNumber(amount),
                        gasLimit: new BigNumber(gasLimit),
                        data: undefined,
                      },
                      specificField,
                    });

                    const res = await getTransactionStatus(account, tx);

                    expect(res.warnings).toEqual(
                      expect.not.objectContaining({
                        feeTooHigh: new FeeTooHigh(),
                      }),
                    );
                  },
                ),
              );
            });

            /**
             * Note: This is to test the upper bound of the x*y*r=a equation
             * with x = gasPrice, y = gasLimit, a = amount, r = ratio
             * This test would pass for r = 10 but would fail for r = 11
             */
            it("should not have a warning for upper bound", async () => {
              const amount = 100;
              const gasLimit = 1;
              const specificField = 10;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                  data: undefined,
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.not.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });
          });

          describe("when tx has data", () => {
            it("should not have a warning", async () => {
              const amount = 1;
              const gasLimit = 1;
              const specificField = 1;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.not.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });
          });

          describe("when tx is nft tx", () => {
            it("should not have a warning for ERC721 NFT", async () => {
              const amount = 1;
              const gasLimit = 1;
              const specificField = 1;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                  mode: "erc721" as const,
                  nft: {
                    collectionName: "",
                    contract: erc721Nft.contract,
                    tokenId: erc721Nft.tokenId,
                    quantity: new BigNumber(1),
                  },
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.not.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });

            it("should not have a warning for ERC1155 NFT", async () => {
              const amount = 1;
              const gasLimit = 1;
              const specificField = 1;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                  mode: "erc1155" as const,
                  nft: {
                    collectionName: "",
                    contract: erc1155Nft.contract,
                    tokenId: erc1155Nft.tokenId,
                    quantity: new BigNumber(1),
                  },
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.not.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });
          });

          describe("when tx is token tx", () => {
            it("should not have a warning", async () => {
              const amount = 1;
              const gasLimit = 1;
              const specificField = 1;

              const tx: Transaction = specifyTx({
                tx: {
                  ...defaultTx,
                  amount: new BigNumber(amount),
                  gasLimit: new BigNumber(gasLimit),
                  subAccountId: tokenAccount.id,
                },
                specificField,
              });

              const res = await getTransactionStatus(account, tx);

              expect(res.warnings).toEqual(
                expect.not.objectContaining({
                  feeTooHigh: new FeeTooHigh(),
                }),
              );
            });
          });
        });
      });

      describe("Global return", () => {
        it("should return the expected informations", async () => {
          const res = await getTransactionStatus(account, legacyTx);

          expect(res).toEqual(
            expect.objectContaining({
              errors: expect.any(Object),
              warnings: expect.any(Object),
              estimatedFees: new BigNumber(2100000),
              amount: legacyTx.amount,
              totalSpent: new BigNumber(2100000).plus(legacyTx.amount),
            }),
          );
        });
      });
    });

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
              gasPrice: undefined,
            } as any;

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
              gasPrice: undefined,
            } as any;

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
              maxFeePerGas: undefined,
            } as any;

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
              maxPriorityFeePerGas: undefined,
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
      jest.mock("../../getTransactionStatus");
      const mockedGetTransactionStatusModule = jest.mocked(getTransactionStatusModule);

      const updatedTx = { ...eip1559Tx, maxFeePerGas: eip1559Tx.maxFeePerGas.plus(100) };

      const originalStatus: TransactionStatus = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(2100000),
        amount: eip1559Tx.amount,
        totalSpent: new BigNumber(2100000).plus(eip1559Tx.amount),
      };

      const editTxErrors = {
        replacementTransactionUnderpriced: new ReplacementTransactionUnderpriced(),
      };

      afterAll(() => {
        jest.restoreAllMocks();
      });

      describe("when original transaction does not have errors", () => {
        describe("when edit transaction checks return errors", () => {
          beforeEach(() => {
            jest
              .spyOn(mockedGetTransactionStatusModule, "validateEditTransaction")
              .mockReturnValue({
                errors: editTxErrors,
                warnings: {},
              });
          });

          it("should add edit transaction checks error to status", () => {
            const res = getEditTransactionStatus({
              transaction: updatedTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatus,
              editType: "speedup",
            });

            expect(mockedGetTransactionStatusModule.validateEditTransaction).toHaveBeenCalled();

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
          beforeEach(() => {
            jest
              .spyOn(mockedGetTransactionStatusModule, "validateEditTransaction")
              .mockReturnValue({ errors: {}, warnings: {} });
          });

          it("should not update the status", async () => {
            const res = getEditTransactionStatus({
              transaction: updatedTx,
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
          beforeEach(() => {
            jest
              .spyOn(mockedGetTransactionStatusModule, "validateEditTransaction")
              .mockReturnValue({
                errors: editTxErrors,
                warnings: {},
              });
          });

          it("should add edit transaction checks error to status", () => {
            const res = getEditTransactionStatus({
              transaction: updatedTx,
              transactionToUpdate: eip1559Tx,
              status: originalStatusWithErrors,
              editType: "speedup",
            });

            expect(mockedGetTransactionStatusModule.validateEditTransaction).toHaveBeenCalled();

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
          beforeEach(() => {
            jest
              .spyOn(mockedGetTransactionStatusModule, "validateEditTransaction")
              .mockReturnValue({ errors: {}, warnings: {} });
          });

          it("should not update the status", async () => {
            const res = getEditTransactionStatus({
              transaction: updatedTx,
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
                transaction: updatedTx,
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

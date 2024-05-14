import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { addTokens, convertERC20, getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { prepareForSignOperation, prepareTransaction } from "../../prepareTransaction";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import { DEFAULT_NONCE, createTransaction } from "../../createTransaction";
import * as nodeApi from "../../api/node/rpc.common";
import {
  account,
  expectedData,
  nftTransaction,
  tokenAccount,
  tokenTransaction,
  transaction,
} from "../fixtures/prepareTransaction.fixtures";
import { getEstimatedFees } from "../../logic";
import { GasOptions, Transaction as EvmTransaction, EvmNftTransaction } from "../../types";
import * as nftAPI from "../../api/nft";
import { getCoinConfig } from "../../config";

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  beforeAll(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        info: {
          node: {
            type: "external",
            uri: "https://my-rpc.com",
          },
          explorer: {
            type: "etherscan",
            uri: "https://api.com",
          },
        },
      };
    });
  });

  describe("prepareTransaction.ts", () => {
    beforeEach(() => {
      // These mocks will be overriden in some tests
      jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => new BigNumber(21000));
      // These mocks will be overriden in some tests
      jest.spyOn(nodeApi, "getFeeData").mockImplementation(async () => ({
        gasPrice: new BigNumber(1),
        maxFeePerGas: new BigNumber(1),
        maxPriorityFeePerGas: new BigNumber(1),
        nextBaseFee: new BigNumber(1),
      }));
      jest.spyOn(nftAPI, "getNftCollectionMetadata").mockImplementation(async input => {
        if (
          input[0]?.contract === "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" &&
          input.length === 1
        ) {
          return [
            {
              status: 200,
              result: {
                contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                tokenName: "Bored Ape",
              },
            },
          ];
        }
        return [];
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("prepareTransaction", () => {
      it("should preserve the reference when no change is detected on the transaction", async () => {
        const tx = await prepareTransaction(account, { ...transaction });
        const tx2 = await prepareTransaction(account, tx);

        expect(tx).toBe(tx2);
      });

      describe("Coins", () => {
        it("should have a gasLimit = 0 when recipient has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...transaction,
            recipient: "notValid",
          });

          expect(tx).toEqual({
            ...transaction,
            recipient: "notValid",
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            type: 2,
          });
        });

        it("should have a gasLimit = 0 when amount has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...transaction,
            amount: new BigNumber(0),
          });

          expect(tx).toEqual({
            ...transaction,
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            type: 2,
          });
        });

        it("should have a gasLimit = 0 when amount has an error and useAllAmount is true", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...transaction,
            amount: new BigNumber(0),
            useAllAmount: true,
          });

          expect(tx).toEqual({
            ...transaction,
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            type: 2,
            useAllAmount: true,
          });
        });

        it("should return an EIP1559 coin transaction", async () => {
          const tx = await prepareTransaction(account, { ...transaction });

          expect(tx).toEqual({
            ...transaction,
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should return a legacy coin transaction", async () => {
          jest.spyOn(nodeApi, "getFeeData").mockImplementationOnce(async () => ({
            gasPrice: new BigNumber(1),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
          }));

          const tx = await prepareTransaction(account, { ...transaction });

          expect(tx).toEqual({
            ...transaction,
            gasPrice: new BigNumber(1),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            type: 0,
          });
        });

        it("should create a coin transaction using all amount in the account", async () => {
          const accountWithBalance = {
            ...account,
            balance: new BigNumber(4206900),
          };
          const transactionWithUseAllAmount = {
            ...transaction,
            useAllAmount: true,
          };

          const tx = await prepareTransaction(accountWithBalance, {
            ...transactionWithUseAllAmount,
          });
          const estimatedFees = new BigNumber(21000); // 21000 gasLimit * 1 maxFeePerGas

          expect(tx).toEqual({
            ...transactionWithUseAllAmount,
            amount: accountWithBalance.balance.minus(estimatedFees),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should do a gas estimation when data has been added to the coin transaction", async () => {
          jest
            .spyOn(nodeApi, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const accountWithBalance = {
            ...account,
            balance: new BigNumber(4206900),
          };
          const tx = await prepareTransaction(accountWithBalance, {
            ...transaction,
            data: Buffer.from("Sm4rTC0ntr4ct", "hex"),
          });

          expect(tx).toEqual({
            ...transaction,
            data: Buffer.from("Sm4rTC0ntr4ct", "hex"),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasLimit: new BigNumber(12),
            type: 2,
          });
        });

        it("should prepare an optimism transaction and return proper additionalFees", async () => {
          const optimism = getCryptoCurrencyById("optimism");
          const opAccount = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", optimism);
          const opTransaction = {
            ...createTransaction(opAccount),
            recipient: ethers.constants.AddressZero,
          };

          jest.spyOn(ethers, "Contract").mockImplementationOnce(() => {
            return {
              getL1Fee: (): ethers.BigNumber => {
                return ethers.BigNumber.from(1234);
              },
            } as any;
          });

          const tx = await prepareTransaction(opAccount, { ...opTransaction });

          expect(tx).toEqual({
            ...opTransaction,
            additionalFees: new BigNumber(1234),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should keep the original transaction `additionalFees` as an addition to the 'on-chain' additionalFees", async () => {
          const optimism = getCryptoCurrencyById("optimism");
          const opAccount = Object.freeze({
            ...makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", optimism),
            balance: new BigNumber(1_000_000),
          });

          const opTransaction = {
            ...createTransaction(opAccount),
            recipient: ethers.constants.AddressZero,
            additionalFees: new BigNumber(4567),
          };

          jest.spyOn(ethers, "Contract").mockImplementationOnce(() => {
            return {
              getL1Fee: (): ethers.BigNumber => {
                return ethers.BigNumber.from(1234);
              },
            } as any;
          });

          const tx1 = await prepareTransaction(opAccount, { ...opTransaction });

          expect(tx1).toEqual({
            ...opTransaction,
            additionalFees: new BigNumber(1234).plus(4567),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });

          const tx2 = await prepareTransaction(opAccount, { ...opTransaction, useAllAmount: true });
          const estimatedFees = getEstimatedFees(tx2);

          expect(tx2).toEqual({
            ...opTransaction,
            amount: opAccount.balance.minus(estimatedFees).minus(1234 + 4567),
            additionalFees: new BigNumber(1234).plus(4567),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
            useAllAmount: true,
          });
        });
      });

      describe("Tokens", () => {
        beforeAll(() => {
          addTokens([
            convertERC20([
              "optimism",
              "usd_coin",
              "USDC",
              6,
              "USD Coin",
              "30440220597e4a9911df217d680aa240ca96f7e8fca24c24e7c673c43820c94b08ef69e402206e975e27e82b3370eca40041fca772bd6c4ca7dd087d2bfcc8aa146cb8e1de53",
              "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
              false,
              false,
              null,
            ]),
          ]);
        });

        it("should have a gasLimit = 0 and no data when recipient has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...tokenTransaction,
            recipient: "notValid",
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            recipient: "notValid",
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            data: undefined,
            type: 2,
          });
        });

        it("should have a gasLimit = 0 when amount has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...tokenTransaction,
            amount: new BigNumber(0),
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            data: expectedData(account, tx, "erc20"),
            type: 2,
          });
        });

        it("should create a token transaction using all amount in the token account", async () => {
          jest
            .spyOn(nodeApi, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };

          const tx = await prepareTransaction(account2, {
            ...tokenTransaction,
            amount: new BigNumber(0),
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            amount: tokenAccountWithBalance.balance,
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
            data: expectedData(account, tx, "erc20"),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(12),
            type: 2,
          });
        });

        it("should go to gas estimation with a transaction without 0 amount", async () => {
          jest
            .spyOn(nodeApi, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };

          const tx = await prepareTransaction(account2, {
            ...tokenTransaction,
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
          });

          expect(nodeApi.getGasEstimation).toBeCalledWith(
            account2,
            expect.objectContaining({
              recipient: tokenAccount.token.contractAddress,
              amount: new BigNumber(0),
              data: expectedData(account, tx, "erc20"),
            }),
          );
        });

        it("should return an EIP1559 token transaction", async () => {
          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };
          const tx = await prepareTransaction(account2, {
            ...tokenTransaction,
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            data: expectedData(account, tokenTransaction, "erc20"),
            gasPrice: undefined,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should return a legacy token transaction", async () => {
          jest.spyOn(nodeApi, "getFeeData").mockImplementationOnce(async () => ({
            gasPrice: new BigNumber(1),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
          }));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };
          const tx = await prepareTransaction(account2, {
            ...tokenTransaction,
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            data: expectedData(account, tokenTransaction, "erc20"),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            gasPrice: new BigNumber(1),
            type: 0,
          });
        });

        it("should keep the original transaction `additionalFees` as an addition to the 'on-chain' additionalFees", async () => {
          jest
            .spyOn(nodeApi, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          jest.spyOn(ethers, "Contract").mockImplementationOnce(() => {
            return {
              getL1Fee: (): ethers.BigNumber => {
                return ethers.BigNumber.from(1234);
              },
            } as any;
          });

          const optimism = getCryptoCurrencyById("optimism");
          const tokenAccountWithBalance = {
            ...makeTokenAccount(
              "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              getTokenById("optimism/erc20/usd_coin"),
            ),
            balance: new BigNumber(200),
          };
          const opAccount = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", optimism, [
            tokenAccountWithBalance,
          ]);

          const opTokenTransaction = {
            ...createTransaction(opAccount),
            recipient: ethers.constants.AddressZero,
            additionalFees: new BigNumber(4567),
            amount: new BigNumber(50),
            subAccountId: tokenAccountWithBalance.id,
          };

          const tx = await prepareTransaction(opAccount, opTokenTransaction);

          expect(tx).toEqual({
            ...opTokenTransaction,
            subAccountId: tokenAccountWithBalance.id,
            data: expectedData(opAccount, opTokenTransaction, "erc20"),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasLimit: new BigNumber(12),
            additionalFees: new BigNumber(1234).plus(4567),
          });
        });
      });

      describe("Gas", () => {
        describe("When feesStrategy provided", () => {
          it("should call getFeeData once", async () => {
            const tx = await prepareTransaction(account, {
              ...transaction,
              feesStrategy: undefined,
            });

            expect(nodeApi.getFeeData).toBeCalledTimes(1);

            expect(tx).toEqual({
              ...transaction,
              feesStrategy: undefined,
              additionalFees: undefined,
              gasPrice: undefined,
              maxFeePerGas: new BigNumber(1),
              maxPriorityFeePerGas: new BigNumber(1),
              type: 2,
            });
          });
        });

        describe("When custom feesStrategy provided", () => {
          it("should use transaction provided data for fees", async () => {
            const tx = await prepareTransaction(account, {
              ...transaction,
              feesStrategy: "custom",
            });

            expect(nodeApi.getFeeData).toBeCalledTimes(0);

            expect(tx).toEqual({
              ...transaction,
              additionalFees: undefined,
              feesStrategy: "custom",
              gasPrice: new BigNumber(0),
              type: 0,
            });
          });
        });

        describe("When gasOptions provided", () => {
          it("should call getFeeData once", async () => {
            const tx = await prepareTransaction(account, {
              ...transaction,
              gasOptions: undefined,
            });

            expect(nodeApi.getFeeData).toBeCalledTimes(1);

            expect(tx).toEqual({
              ...transaction,
              gasPrice: undefined,
              maxFeePerGas: new BigNumber(1),
              maxPriorityFeePerGas: new BigNumber(1),
              type: 2,
            });
          });

          it("should use gasOptions values for fee data", async () => {
            const gasOptions: GasOptions = {
              slow: {
                maxFeePerGas: new BigNumber(10),
                maxPriorityFeePerGas: new BigNumber(1),
                gasPrice: null,
                nextBaseFee: new BigNumber(1),
              },
              medium: {
                maxFeePerGas: new BigNumber(20),
                maxPriorityFeePerGas: new BigNumber(2),
                gasPrice: null,
                nextBaseFee: new BigNumber(1),
              },
              fast: {
                maxFeePerGas: new BigNumber(30),
                maxPriorityFeePerGas: new BigNumber(3),
                gasPrice: null,
                nextBaseFee: new BigNumber(1),
              },
            };
            const tx = await prepareTransaction(account, {
              ...transaction,
              gasOptions,
            });

            expect(nodeApi.getFeeData).toBeCalledTimes(0);

            expect(tx).toEqual({
              ...transaction,
              additionalFees: undefined,
              gasPrice: undefined,
              gasOptions,
              maxFeePerGas: new BigNumber(20),
              maxPriorityFeePerGas: new BigNumber(2),
              type: 2,
            });
          });
        });
      });

      describe("Nfts", () => {
        it("should have a gasLimit = 0 and no data when recipient has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...nftTransaction,
            recipient: "notValid",
          });

          expect(tx).toEqual({
            ...nftTransaction,
            nft: {
              ...nftTransaction.nft,
              collectionName: "Bored Ape",
            },
            recipient: "notValid",
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            data: undefined,
            type: 2,
          });
        });

        it("should have a gasLimit = 0 when amount has an error", async () => {
          jest.spyOn(nodeApi, "getGasEstimation").mockImplementation(async () => {
            throw new Error();
          });

          const tx = await prepareTransaction(account, {
            ...nftTransaction,
            amount: new BigNumber(0),
          });

          expect(tx).toEqual({
            ...nftTransaction,
            nft: {
              ...nftTransaction.nft,
              collectionName: "Bored Ape",
            },
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(0),
            data: expectedData(account, nftTransaction, "erc721"),
            type: 2,
          });
        });

        it("should keep the original transaction `additionalFees` as an addition to the 'on-chain' additionalFees", async () => {
          jest.spyOn(ethers, "Contract").mockImplementationOnce(() => {
            return {
              getL1Fee: (): ethers.BigNumber => {
                return ethers.BigNumber.from(1234);
              },
            } as any;
          });

          const optimism = getCryptoCurrencyById("optimism");
          const opAccount = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", optimism);

          const opNftTransaction: EvmTransaction & EvmNftTransaction = {
            ...createTransaction(opAccount),
            mode: "erc721",
            recipient: ethers.constants.AddressZero,
            additionalFees: new BigNumber(4567),
            amount: new BigNumber(0),
            nft: {
              contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
              tokenId: "1",
              quantity: new BigNumber(1),
              collectionName: "",
            },
          };

          const tx = await prepareTransaction(opAccount, opNftTransaction);

          expect(tx).toEqual({
            ...opNftTransaction,
            data: expectedData(opAccount, opNftTransaction, "erc721"),
            nft: {
              ...nftTransaction.nft,
              collectionName: "Bored Ape",
            },
            additionalFees: new BigNumber(1234).plus(4567),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        describe("ERC721", () => {
          it("should return an EIP1559 erc721 nft transaction", async () => {
            const tx = await prepareTransaction(account, {
              ...nftTransaction,
            });

            expect(tx).toEqual({
              ...nftTransaction,
              data: expectedData(account, tx, "erc721"),
              nft: {
                ...nftTransaction.nft,
                collectionName: "Bored Ape",
              },
              gasPrice: undefined,
              maxFeePerGas: new BigNumber(1),
              maxPriorityFeePerGas: new BigNumber(1),
              type: 2,
            });
          });

          it("should return a legacy erc721 nft transaction", async () => {
            jest.spyOn(nodeApi, "getFeeData").mockImplementationOnce(async () => ({
              gasPrice: new BigNumber(1),
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
              nextBaseFee: null,
            }));
            const tx = await prepareTransaction(account, {
              ...nftTransaction,
            });

            expect(tx).toEqual({
              ...nftTransaction,
              data: expectedData(account, tx, "erc721"),
              nft: {
                ...nftTransaction.nft,
                collectionName: "Bored Ape",
              },
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
              gasPrice: new BigNumber(1),
              type: 0,
            });
          });
        });

        describe("ERC1155", () => {
          it("should return an EIP1559 erc1155 nft transaction", async () => {
            const tx = await prepareTransaction(account, {
              ...nftTransaction,
              mode: "erc1155",
            });

            expect(tx).toEqual({
              ...nftTransaction,
              mode: "erc1155",
              data: expectedData(account, tx, "erc1155"),
              nft: {
                ...nftTransaction.nft,
                collectionName: "Bored Ape",
              },
              gasPrice: undefined,
              maxFeePerGas: new BigNumber(1),
              maxPriorityFeePerGas: new BigNumber(1),
              type: 2,
            });
          });

          it("should return a legacy erc1155 nft transaction", async () => {
            jest.spyOn(nodeApi, "getFeeData").mockImplementationOnce(async () => ({
              gasPrice: new BigNumber(1),
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
              nextBaseFee: null,
            }));
            const tx = await prepareTransaction(account, {
              ...nftTransaction,
              mode: "erc1155",
            });

            expect(tx).toEqual({
              ...nftTransaction,
              mode: "erc1155",
              data: expectedData(account, tx, "erc1155"),
              nft: {
                ...nftTransaction.nft,
                collectionName: "Bored Ape",
              },
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
              gasPrice: new BigNumber(1),
              type: 0,
            });
          });
        });
      });
    });

    describe("prepareForSignOperation", () => {
      const mockedNodeApi = jest.mocked(nodeApi);
      beforeEach(() => {
        jest.spyOn(nodeApi, "getTransactionCount").mockImplementation(() => Promise.resolve(10));
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      describe("if transaction nonce is not already valid", () => {
        it("should not change a coin transaction", async () => {
          expect(
            await prepareForSignOperation({
              account,
              transaction: { ...transaction, nonce: DEFAULT_NONCE },
            }),
          ).toEqual({
            ...transaction,
            nonce: 10,
          });

          expect(mockedNodeApi.getTransactionCount).toHaveBeenCalledTimes(1);
        });

        it("should update a token transaction with the correct recipient", async () => {
          expect(
            await prepareForSignOperation({
              account,
              transaction: { ...tokenTransaction, nonce: DEFAULT_NONCE },
            }),
          ).toEqual({
            ...tokenTransaction,
            amount: new BigNumber(0),
            recipient: tokenAccount.token.contractAddress,
            nonce: 10,
          });

          expect(mockedNodeApi.getTransactionCount).toHaveBeenCalledTimes(1);
        });

        it("should update an NFT transaction with the correct recipient", async () => {
          expect(
            await prepareForSignOperation({
              account,
              transaction: { ...nftTransaction, nonce: DEFAULT_NONCE },
            }),
          ).toEqual({
            ...nftTransaction,
            amount: new BigNumber(0),
            recipient: nftTransaction.nft.contract,
            nonce: 10,
          });

          expect(mockedNodeApi.getTransactionCount).toHaveBeenCalledTimes(1);
        });
      });

      describe("if transaction nonce is already valid", () => {
        it("should not change the transaction nonce", async () => {
          expect(
            await prepareForSignOperation({
              account,
              transaction: { ...transaction, nonce: 1 },
            }),
          ).toEqual({
            ...transaction,
            nonce: 1,
          });

          expect(mockedNodeApi.getTransactionCount).not.toHaveBeenCalled();
        });
      });
    });
  });
});

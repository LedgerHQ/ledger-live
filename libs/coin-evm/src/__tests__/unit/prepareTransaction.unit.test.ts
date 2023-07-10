import BigNumber from "bignumber.js";
import { prepareForSignOperation, prepareTransaction } from "../../prepareTransaction";
import * as rpcAPI from "../../api/rpc/rpc.common";
import {
  account,
  expectedData,
  nftTransaction,
  tokenAccount,
  tokenTransaction,
  transaction,
} from "../fixtures/prepareTransaction.fixtures";
import { GasOptions } from "../../types";
import * as nftAPI from "../../api/nft";

describe("EVM Family", () => {
  describe("prepareTransaction.ts", () => {
    beforeEach(() => {
      // These mocks will be overriden in some tests
      jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => new BigNumber(21000));
      // These mocks will be overriden in some tests
      jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementation(async () => ({
        gasPrice: new BigNumber(1),
        maxFeePerGas: new BigNumber(1),
        maxPriorityFeePerGas: new BigNumber(1),
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
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
          jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementationOnce(async () => ({
            gasPrice: new BigNumber(1),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
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
            .spyOn(rpcAPI, "getGasEstimation")
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
      });

      describe("Tokens", () => {
        it("should have a gasLimit = 0 and no data when recipient has an error", async () => {
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
            .spyOn(rpcAPI, "getGasEstimation")
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
            .spyOn(rpcAPI, "getGasEstimation")
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

          expect(rpcAPI.getGasEstimation).toBeCalledWith(
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
          jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementationOnce(async () => ({
            gasPrice: new BigNumber(1),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
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
      });

      describe("Gas", () => {
        describe("When feesStrategy provided", () => {
          it("should call getFeesEstimation once", async () => {
            const tx = await prepareTransaction(account, {
              ...transaction,
              feesStrategy: undefined,
            });

            expect(rpcAPI.getFeesEstimation).toBeCalledTimes(1);

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

            expect(rpcAPI.getFeesEstimation).toBeCalledTimes(0);

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
          it("should call getFeesEstimation once", async () => {
            const tx = await prepareTransaction(account, {
              ...transaction,
              gasOptions: undefined,
            });

            expect(rpcAPI.getFeesEstimation).toBeCalledTimes(1);

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
              },
              medium: {
                maxFeePerGas: new BigNumber(20),
                maxPriorityFeePerGas: new BigNumber(2),
                gasPrice: null,
              },
              fast: {
                maxFeePerGas: new BigNumber(30),
                maxPriorityFeePerGas: new BigNumber(3),
                gasPrice: null,
              },
            };
            const tx = await prepareTransaction(account, {
              ...transaction,
              gasOptions,
            });

            expect(rpcAPI.getFeesEstimation).toBeCalledTimes(0);

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
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
          jest.spyOn(rpcAPI, "getGasEstimation").mockImplementation(async () => {
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
            jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementationOnce(async () => ({
              gasPrice: new BigNumber(1),
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
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
            jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementationOnce(async () => ({
              gasPrice: new BigNumber(1),
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
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
      beforeEach(() => {
        jest.spyOn(rpcAPI, "getTransactionCount").mockImplementation(() => Promise.resolve(10));
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should not change a coin transaction", async () => {
        expect(await prepareForSignOperation(account, transaction)).toEqual({
          ...transaction,
          nonce: 10,
        });
      });

      it("should update a token transaction with the correct recipient", async () => {
        expect(await prepareForSignOperation(account, tokenTransaction)).toEqual({
          ...tokenTransaction,
          amount: new BigNumber(0),
          recipient: tokenAccount.token.contractAddress,
          nonce: 10,
        });
      });

      it("should update an NFT transaction with the correct recipient", async () => {
        expect(await prepareForSignOperation(account, nftTransaction)).toEqual({
          ...nftTransaction,
          amount: new BigNumber(0),
          recipient: nftTransaction.nft.contract,
          nonce: 10,
        });
      });
    });
  });
});

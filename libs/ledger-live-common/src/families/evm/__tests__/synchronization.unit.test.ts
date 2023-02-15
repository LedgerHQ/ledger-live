import BigNumber from "bignumber.js";
import { AssertionError } from "assert";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeOperation, makeTokenAccount } from "../testUtils";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import * as synchronization from "../synchronization";
import { decodeAccountId } from "../../../account";
import * as etherscanAPI from "../api/etherscan";
import * as rpcAPI from "../api/rpc.common";
import { getEnv } from "../../../env";
import * as logic from "../logic";

jest.useFakeTimers().setSystemTime(new Date("2014-04-21"));

const currency: CryptoCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "https://my-rpc.com",
    explorer: {
      uri: "https://api.com",
      type: "etherscan",
    },
  },
};
const getAccountShapeParameters: AccountShapeInfo = {
  address: "0xkvn",
  currency,
  derivationMode: "",
  derivationPath: "44'/60'/0'/0/0",
  index: 0,
};
const tokenCurrency1 = getTokenById("ethereum/erc20/usd__coin");
const tokenCurrency2 = getTokenById("ethereum/erc20/usd_tether__erc20_");
const tokenAccount = makeTokenAccount("0xkvn", tokenCurrency1);
const account = {
  ...makeAccount("0xkvn", currency, [tokenAccount]),
  syncHash: logic.getSyncHash(currency),
};
const coinOperation1 = makeOperation({
  hash: "0xH4sH",
  accountId: "js:2:ethereum:0xkvn:",
  blockHash:
    "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
  senders: ["0xd48f2332Eeed88243Cb6b1D0d65a10368A5370f0"], // johnnyhallyday.eth
  transactionSequenceNumber: 1,
  date: new Date(),
  blockHeight: 1,
});
const coinOperation2 = makeOperation({
  hash: "0xOtherHash",
  accountId: "js:2:ethereum:0xkvn:",
  transactionSequenceNumber: 2,
  date: new Date(Date.now() + 1),
  blockHeight: 100,
});
const coinOperation3 = makeOperation({
  hash: "0xYeTAnOtherHash",
  accountId: "js:2:ethereum:0xkvn:",
  transactionSequenceNumber: 5,
  date: new Date(Date.now() + 2),
  blockHeight: 1000,
});
const tokenOperation1 = makeOperation({
  hash: "0xH4sHT0k3n",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd__coin",
  blockHash:
    "0x95dc138a02c1b0e3fd49305f785e8e27e88a885004af13a9b4c62ad94eed07dd",
  recipients: ["0xB0B"],
  senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
  contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  value: new BigNumber(152021496),
  fee: new BigNumber(1935663357068271),
  type: "OUT",
  date: new Date(),
  blockHeight: 10,
});
const tokenOperation2 = makeOperation({
  hash: "0xTokenHashAga1n",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd__coin",
  contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  date: new Date(Date.now() + 1),
  blockHeight: 1000,
});
const tokenOperation3 = makeOperation({
  hash: "0xTokenHashAga1n",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd__coin",
  contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  date: new Date(Date.now() + 2),
  blockHeight: 10000,
});
const tokenOperation4 = makeOperation({
  hash: "0xTokenHashOtherToken",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd_tether__erc20_",
  contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  date: new Date(Date.now() + 3),
  blockHeight: 11000,
});
const ignoredTokenOperation = makeOperation({
  hash: "0xigN0r3Me",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd_tether__erc20_",
  contract: "0xUnknownContract",
  date: new Date(Date.now() + 4),
  blockHeight: 12000,
});
const pendingOperation = makeOperation({
  hash: "123",
});

describe("EVM Family", () => {
  describe("synchronization.ts", () => {
    describe("getAccountShape", () => {
      beforeEach(() => {
        // Mocking getAccount to prevent network calls
        jest.spyOn(rpcAPI, "getBalanceAndBlock").mockImplementation(() =>
          Promise.resolve({
            blockHeight: 10,
            balance: new BigNumber(100),
          })
        );
        jest.spyOn(rpcAPI, "getSubAccount").mockImplementation(() =>
          Promise.resolve({
            blockHeight: 10,
            balance: new BigNumber(100),
            nonce: 1,
          })
        );
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it("should throw for currency without ethereumLikeInfo", async () => {
        try {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              currency: {
                ...currency,
                ethereumLikeInfo: undefined,
              },
            },
            {} as any
          );
          fail("Promise should have been rejected");
        } catch (e: any) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e.message).toEqual("API type not supported");
        }
      });

      it("should throw for currency with unsupported explorer", async () => {
        try {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              currency: {
                ...currency,
                ethereumLikeInfo: {
                  chainId: 1,
                  explorer: {
                    uri: "http://nope.com",
                    type: "unsupported" as any,
                  },
                },
              },
            },
            {} as any
          );
          fail("Promise should have been rejected");
        } catch (e: any) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e.message).toEqual("API type not supported");
        }
      });

      describe("With no transactions fetched", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLastCoinOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLastCoinOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI, "getLastTokenOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLastTokenOperations")
            .mockImplementation(() => Promise.resolve([]));
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should return an account with a valid id", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(decodeAccountId(account.id || "")).toEqual({
            type: "js",
            version: "2",
            currencyId: currency.id,
            xpubOrAddress: "0xkvn",
            derivationMode: "",
          });
        });

        it("should return an account with the correct balance", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.balance).toEqual(new BigNumber(100));
        });

        it("should return an account with the correct operations count", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.operationsCount).toBe(account.operations?.length);
        });

        it("should return an account with the correct block height", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.blockHeight).toBe(10);
        });

        it("should keep the operations from a sync to another", async () => {
          const operations = [coinOperation1];
          const tokenOperations = [tokenOperation1];
          const accountWithSubAccount = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations,
                subAccounts: [{ ...tokenAccount, operations: tokenOperations }],
              },
            },
            {} as any
          );
          expect(accountWithSubAccount.operations).toBe(operations);
          expect(accountWithSubAccount?.subAccounts?.[0].operations).toBe(
            tokenOperations
          );
        });

        it("should do a full sync when syncHash changes", async () => {
          jest
            .spyOn(logic, "getSyncHash")
            .mockImplementationOnce(() => "0xNope");

          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations: [coinOperation1],
                subAccounts: [
                  { ...tokenAccount, operations: [tokenOperation1] },
                ],
              },
            },
            {} as any
          );

          expect(
            etherscanAPI?.default.getLastCoinOperations
          ).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            0
          );
          expect(
            etherscanAPI?.default.getLastTokenOperations
          ).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            0
          );
        });

        it("should do a full sync when syncHash changes", async () => {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations: [coinOperation1],
                subAccounts: [
                  { ...tokenAccount, operations: [tokenOperation1] },
                ],
              },
            },
            {} as any
          );

          expect(
            etherscanAPI?.default.getLastCoinOperations
          ).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            coinOperation1.blockHeight
          );
          expect(
            etherscanAPI?.default.getLastTokenOperations
          ).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            tokenOperation1.blockHeight
          );
        });
      });

      describe("With transactions fetched", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI?.default, "getLastCoinOperations")
            .mockImplementation(() =>
              Promise.resolve([coinOperation1, coinOperation2])
            );
          jest
            .spyOn(etherscanAPI?.default, "getLastTokenOperations")
            .mockImplementation(() =>
              Promise.resolve([
                {
                  tokenCurrency: tokenCurrency1,
                  operation: tokenOperation1,
                },
                {
                  tokenCurrency: tokenCurrency1,
                  operation: tokenOperation2,
                },
              ])
            );
          jest
            .spyOn(rpcAPI, "getTokenBalance")
            .mockImplementation(async (a, b, contractAddress) => {
              if (contractAddress === tokenCurrency1.contractAddress) {
                return new BigNumber(10000);
              }
              throw new Error(
                "Shouldn't be trying to fetch this token balance"
              );
            });
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should add the fetched transactions to the operations", async () => {
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: account,
            },
            {} as any
          );
          expect(accountShape.operations).toEqual([
            coinOperation2,
            coinOperation1,
          ]);
          expect(accountShape?.subAccounts?.[0]?.operations).toEqual([
            tokenOperation2,
            tokenOperation1,
          ]);
        });

        it("should return a partial account based on blockHeight", async () => {
          jest
            .spyOn(etherscanAPI?.default, "getLastCoinOperations")
            .mockImplementation(() => Promise.resolve([coinOperation3]));
          const operations = [coinOperation2, coinOperation1];
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations,
              },
            },
            {} as any
          );

          expect(accountShape).toEqual({
            type: "Account",
            id: account.id,
            syncHash: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/), // matching a sha256 hex
            balance: new BigNumber(100),
            spendableBalance: new BigNumber(100),
            blockHeight: 10,
            operations: [coinOperation3, coinOperation2, coinOperation1],
            operationsCount: 3,
            subAccounts: [
              {
                ...tokenAccount,
                balance: new BigNumber(10000),
                spendableBalance: new BigNumber(10000),
                operations: [tokenOperation2, tokenOperation1],
                operationsCount: 2,
              },
            ],
            lastSyncDate: new Date("2014-04-21"),
          });
        });
      });

      describe("With pending operations", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLastCoinOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLastCoinOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI, "getLastTokenOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLastTokenOperations")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(synchronization, "getOperationStatus")
            .mockImplementation((currency, op) =>
              Promise.resolve(op.hash === "0xH4sH" ? coinOperation1 : null)
            );
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should add the confirmed pending operation to the operations", async () => {
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                // 2 operations to confirm here, they're differenciated by id
                pendingOperations: [
                  coinOperation1,
                  {
                    ...coinOperation1,
                    hash: "0xN0tH4sH",
                    id: "js:2:ethereum:0xkvn:-0xN0tH4sH-OUT",
                  },
                ],
              },
            },
            {} as any
          );

          expect(accountShape.operations).toEqual([coinOperation1]);
        });
      });
    });

    describe("getSubAccounts", () => {
      beforeEach(() => {
        jest
          .spyOn(rpcAPI, "getTokenBalance")
          .mockImplementation(async (a, b, contractAddress) => {
            switch (contractAddress) {
              case "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": // usdc
                return new BigNumber(1);
              case "0xdAC17F958D2ee523a2206206994597C13D831ec7": // usdt
                return new BigNumber(2);
              default:
                return new BigNumber(0);
            }
          });
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return the right subAccounts", async () => {
        jest
          .spyOn(etherscanAPI?.default, "getLastTokenOperations")
          .mockImplementation(async () => [
            { tokenCurrency: tokenCurrency1, operation: tokenOperation1 },
            { tokenCurrency: tokenCurrency1, operation: tokenOperation2 },
            { tokenCurrency: tokenCurrency2, operation: tokenOperation4 },
            {
              tokenCurrency: undefined as any,
              operation: ignoredTokenOperation,
            },
          ]);

        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id
        );

        const expectedUsdcAccount = {
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperation1, tokenOperation2],
          operationsCount: 2,
          starred: undefined,
          swapHistory: undefined,
        };
        const expectedUsdtAccount = {
          ...makeTokenAccount(account.freshAddress, tokenCurrency2),
          balance: new BigNumber(2),
          spendableBalance: new BigNumber(2),
          operations: [tokenOperation4],
          operationsCount: 1,
          starred: undefined,
          swapHistory: undefined,
        };

        expect(tokenAccounts).toEqual([
          expectedUsdcAccount,
          expectedUsdtAccount,
        ]);
      });

      it("should return a partial sub account based on blockHeight", async () => {
        jest
          .spyOn(etherscanAPI?.default, "getLastTokenOperations")
          .mockImplementation(async () => [
            { tokenCurrency: tokenCurrency1, operation: tokenOperation3 },
          ]);

        const incompleteUsdcAccount = {
          ...tokenAccount,
          balance: new BigNumber(0),
          spendableBalance: new BigNumber(0),
          operations: [tokenOperation1, tokenOperation2],
          operationsCount: 1,
        };
        const accountWithIncompleteSubAccount = {
          ...account,
          subAccounts: [incompleteUsdcAccount],
        };

        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: accountWithIncompleteSubAccount,
          },
          account.id
        );

        const expectedUsdcAccount = {
          ...incompleteUsdcAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperation3],
          operationsCount: 1,
          starred: undefined,
          swapHistory: undefined,
        };

        expect(tokenAccounts).toEqual([expectedUsdcAccount]);
        // (currency, address, accountId, fromBlock)
        expect(etherscanAPI.default.getLastTokenOperations).toBeCalledWith(
          currency,
          account.freshAddress,
          account.id,
          tokenOperation2.blockHeight
        );
      });

      it("should throw for currency with unsupported explorer", async () => {
        try {
          await synchronization.getSubAccounts(
            {
              ...getAccountShapeParameters,
              currency: {
                ...currency,
                ethereumLikeInfo: {
                  chainId: 1,
                  explorer: {
                    uri: "http://nope.com",
                    type: "unsupported" as any,
                  },
                },
              },
            },
            account.id
          );
          fail("Promise should have been rejected");
        } catch (e: any) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e.message).toEqual("API type not supported");
        }
      });
    });

    describe("getSubAccountShape", () => {
      beforeEach(() => {
        jest
          .spyOn(rpcAPI, "getTokenBalance")
          .mockImplementation(async (a, b, contractAddress) => {
            switch (contractAddress) {
              case "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": // usdc
                return new BigNumber(1);
              case "0xdAC17F958D2ee523a2206206994597C13D831ec7": // usdt
                return new BigNumber(2);
              default:
                return new BigNumber(0);
            }
          });
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return a correct sub account shape", async () => {
        const subAccount = await synchronization.getSubAccountShape(
          currency,
          account.id,
          tokenCurrency1,
          [tokenOperation1, tokenOperation2, tokenOperation3]
        );

        expect(subAccount).toEqual({
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperation1, tokenOperation2, tokenOperation3],
          operationsCount: 3,
          starred: undefined,
          swapHistory: undefined,
        });
      });
    });

    describe("getOperationStatus", () => {
      it("should not throw on fail", async () => {
        jest.spyOn(rpcAPI, "getTransaction").mockImplementationOnce(() => {
          throw new Error();
        });

        expect(
          await synchronization.getOperationStatus(currency, coinOperation1)
        ).toBe(null);
      });

      it("should return null if retrieved transaction has no blockHeight", async () => {
        jest.spyOn(rpcAPI, "getTransaction").mockImplementationOnce(
          async () =>
            ({
              blockHash: "hash",
              timestamp: 101010010,
              nonce: 1,
            } as any)
        );

        expect(
          await synchronization.getOperationStatus(currency, coinOperation1)
        ).toBe(null);
      });

      it("should return the retrieved operation with network properties", async () => {
        jest.spyOn(rpcAPI, "getTransaction").mockImplementationOnce(
          async () =>
            ({
              blockNumber: 10,
              blockHash: "hash",
              timestamp: Date.now() / 1000,
              nonce: 123,
            } as any)
        );

        expect(
          await synchronization.getOperationStatus(currency, coinOperation1)
        ).toEqual({
          ...coinOperation1,
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: 123,
        });
      });

      it("should return the retrieved operation with network properties even if the rpc doesn't return timestamp", async () => {
        jest.spyOn(rpcAPI, "getTransaction").mockImplementationOnce(
          async () =>
            ({
              blockNumber: 10,
              blockHash: "hash",
              nonce: 123,
            } as any)
        );
        jest
          .spyOn(rpcAPI, "getBlock")
          .mockImplementationOnce(
            async () => ({ timestamp: Date.now() / 1000 } as any)
          );

        expect(
          await synchronization.getOperationStatus(currency, coinOperation1)
        ).toEqual({
          ...coinOperation1,
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: 123,
        });
      });
    });

    describe("postSync", () => {
      it("should return the freshly synced subAccounts", () => {
        const tokenAccountWithPending = {
          ...tokenAccount,
          pendingOperations: [pendingOperation],
        };
        const accountWithTokenAccount = {
          ...account,
          subAccounts: [tokenAccountWithPending],
        };

        expect(
          synchronization.postSync(
            { ...account, subAccounts: [] },
            accountWithTokenAccount
          )
        ).toEqual(accountWithTokenAccount);
      });

      it("should remove pending operations if the main account has removed it", () => {
        const tokenAccountWithPending = {
          ...tokenAccount,
          pendingOperations: [pendingOperation],
        };
        const accountWithPending = {
          ...account,
          subAccounts: [tokenAccountWithPending],
          pendingOperations: [pendingOperation],
        };

        // should not change anything if we maintain the pending op
        expect(
          synchronization.postSync(accountWithPending, accountWithPending)
        ).toEqual(accountWithPending);
        // Should remove the pending from tokenAccount as well if removed from main account
        expect(
          synchronization.postSync(accountWithPending, {
            ...accountWithPending,
            pendingOperations: [],
          })
        ).toEqual(account);
      });

      it("should remove pending operation if the token account has confirmed it", () => {
        const tokenAccountWithPending = {
          ...tokenAccount,
          pendingOperations: [pendingOperation],
        };
        const accountWithPending = {
          ...account,
          subAccounts: [tokenAccountWithPending],
          pendingOperations: [pendingOperation],
        };

        // Should remove the pending from tokenAccount if it was confirmed in the tokenAccount ops
        expect(
          synchronization.postSync(accountWithPending, {
            ...accountWithPending,
            pendingOperations: [pendingOperation],
            subAccounts: [
              {
                ...tokenAccountWithPending,
                operations: [pendingOperation],
              },
            ],
          })
        ).toEqual({
          ...accountWithPending,
          subAccounts: [
            {
              ...tokenAccountWithPending,
              operations: [pendingOperation],
              pendingOperations: [],
            },
          ],
        });
      });

      it("should remove pending operation if ", () => {
        const latePending = {
          ...pendingOperation,
          date: new Date() + getEnv("OPERATION_OPTIMISTIC_RETENTION") + 1,
        };
        const tokenAccountWithPending = {
          ...tokenAccount,
          pendingOperations: [latePending],
        };
        const accountWithTokenAccount = {
          ...account,
          subAccounts: [tokenAccountWithPending],
        };

        // Should remove the pending from tokenAccount if it was confirmed in the tokenAccount ops
        expect(
          synchronization.postSync(
            accountWithTokenAccount,
            accountWithTokenAccount
          )
        ).toEqual(account);
      });
    });
  });
});

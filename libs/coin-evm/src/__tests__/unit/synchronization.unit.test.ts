import { AssertionError, fail } from "assert";
import BigNumber from "bignumber.js";
import { decodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeTokenAccount } from "../fixtures/common.fixtures";
import * as etherscanAPI from "../../api/explorer/etherscan";
import * as synchronization from "../../synchronization";
import * as nodeApi from "../../api/node/rpc.common";
import {
  account,
  coinOperations,
  currency,
  erc1155Operations,
  erc721Operations,
  nfts,
  pendingOperation,
  tokenAccount,
  tokenCurrencies,
  tokenOperations,
  internalOperations,
} from "../fixtures/synchronization.fixtures";
import { UnknownNode } from "../../errors";
import { getEnv } from "../../../../env";
import * as logic from "../../logic";

jest.mock("../../api/node/rpc.common");
jest.useFakeTimers().setSystemTime(new Date("2014-04-21"));

const getAccountShapeParameters: AccountShapeInfo = {
  address: "0xkvn",
  currency,
  derivationMode: "",
  derivationPath: "44'/60'/0'/0/0",
  index: 0,
};

describe("EVM Family", () => {
  describe("synchronization.ts", () => {
    describe("getAccountShape", () => {
      beforeEach(() => {
        // Mocking getAccount to prevent network calls
        jest.spyOn(nodeApi, "getCoinBalance").mockImplementation(async () => new BigNumber(100));
        jest.spyOn(nodeApi, "getBlockByHeight").mockImplementation(async () => ({
          hash: "blockHash6969",
          height: 6969,
          timestamp: Date.now(),
        }));
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
            {} as any,
          );
          fail("Promise should have been rejected");
        } catch (e: any) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownNode);
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
                } as any,
              },
            },
            {} as any,
          );
          fail("Promise should have been rejected");
        } catch (e: any) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownNode);
        }
      });

      describe("With no transactions fetched", () => {
        beforeAll(() => {
          jest.spyOn(etherscanAPI, "getLastOperations").mockImplementation(() =>
            Promise.resolve({
              lastCoinOperations: [],
              lastTokenOperations: [],
              lastNftOperations: [],
              lastInternalOperations: [],
            }),
          );
          jest.spyOn(etherscanAPI?.default, "getLastOperations").mockImplementation(() =>
            Promise.resolve({
              lastCoinOperations: [],
              lastTokenOperations: [],
              lastNftOperations: [],
              lastInternalOperations: [],
            }),
          );
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should return an account with a valid id", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any,
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
            {} as any,
          );
          expect(account.balance).toEqual(new BigNumber(100));
        });

        it("should return an account with the correct operations count", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any,
          );
          expect(account.operationsCount).toBe(account.operations?.length);
        });

        it("should return an account with the correct block height", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any,
          );
          expect(account.blockHeight).toBe(6969);
        });

        it("should keep the operations from a sync to another", async () => {
          const operations = [coinOperations[0]];
          const tokenOps = [tokenOperations[0]];
          const accountWithSubAccount = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations,
                subAccounts: [{ ...tokenAccount, operations: tokenOps }],
              },
            },
            {} as any,
          );
          expect(accountWithSubAccount.operations).toBe(operations);
          expect(accountWithSubAccount?.subAccounts?.[0].operations).toBe(tokenOps);
        });

        it("should do a full sync when syncHash changes", async () => {
          jest.spyOn(logic, "getSyncHash").mockImplementationOnce(() => "0xNope");

          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations: [coinOperations[0]],
                subAccounts: [{ ...tokenAccount, operations: [tokenOperations[0]] }],
              },
            },
            {} as any,
          );

          expect(etherscanAPI?.default.getLastOperations).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            0,
            6969,
          );
        });

        it("should do an incremental sync when syncHash is identical", async () => {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations: [coinOperations[2]],
                subAccounts: [{ ...tokenAccount, operations: [tokenOperations[0]] }],
              },
            },
            {} as any,
          );

          expect(etherscanAPI?.default.getLastOperations).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            coinOperations[2].blockHeight! - synchronization.SAFE_REORG_THRESHOLD,
            6969,
          );
        });
      });

      describe("With transactions fetched", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLastCoinOperations")
            .mockImplementation(() =>
              Promise.resolve([{ ...coinOperations[0] }, { ...coinOperations[1] }]),
            );
          jest
            .spyOn(etherscanAPI, "getLastTokenOperations")
            .mockImplementation(() =>
              Promise.resolve([{ ...tokenOperations[0] }, { ...tokenOperations[1] }]),
            );
          jest
            .spyOn(etherscanAPI, "getLastNftOperations")
            .mockImplementation(() =>
              Promise.resolve([
                { ...erc721Operations[0] },
                { ...erc721Operations[1] },
                { ...erc721Operations[2] },
                { ...erc1155Operations[0] },
                { ...erc1155Operations[1] },
              ]),
            );
          jest
            .spyOn(etherscanAPI, "getLastInternalOperations")
            .mockImplementation(() =>
              Promise.resolve([
                { ...internalOperations[0] },
                { ...internalOperations[1] },
                { ...internalOperations[2] },
              ]),
            );
          jest
            .spyOn(nodeApi, "getTokenBalance")
            .mockImplementation(async (a, b, contractAddress) => {
              if (contractAddress === tokenCurrencies[0].contractAddress) {
                return new BigNumber(10000);
              }
              throw new Error("Shouldn't be trying to fetch this token balance");
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
            {} as any,
          );

          expect(accountShape.operations).toEqual([
            {
              ...coinOperations[1],
              nftOperations: [erc721Operations[1], erc721Operations[2], erc1155Operations[1]],
              internalOperations: [internalOperations[1]],
            },
            {
              ...tokenOperations[1],
              id: `js:2:ethereum:0xkvn:-${tokenOperations[1].hash}-NONE`,
              type: "NONE",
              value: new BigNumber(0),
              fee: new BigNumber(0),
              senders: [],
              recipients: [],
              subOperations: [tokenOperations[1]],
              accountId: "",
              contract: undefined,
            },
            {
              ...coinOperations[0],
              subOperations: [tokenOperations[0]],
              nftOperations: [erc721Operations[0], erc1155Operations[0]],
              internalOperations: [internalOperations[0]],
            },
            {
              id: `js:2:ethereum:0xkvn:-${internalOperations[2].hash}-NONE`,
              type: "NONE",
              hash: internalOperations[2].hash,
              value: new BigNumber(0),
              fee: new BigNumber(0),
              recipients: [],
              senders: [],
              accountId: "",
              blockHash: null,
              blockHeight: internalOperations[2].blockHeight,
              subOperations: [],
              nftOperations: [],
              internalOperations: [internalOperations[2]],
              date: internalOperations[2].date,
              transactionSequenceNumber: 0,
              extra: {},
            },
          ]);

          expect(accountShape?.subAccounts?.[0]?.operations).toEqual([
            tokenOperations[1],
            tokenOperations[0],
          ]);
        });

        it("should add aggregated NFTs to the account", async () => {
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: account,
            },
            {} as any,
          );

          expect(accountShape.nfts).toEqual([nfts[0], nfts[1]]);
        });

        it("should return a partial account based on blockHeight", async () => {
          jest.spyOn(etherscanAPI?.default, "getLastOperations").mockImplementation(async () => ({
            lastTokenOperations: [],
            lastNftOperations: [],
            lastCoinOperations: [coinOperations[2]],
            lastInternalOperations: [],
          }));
          const operations = [
            {
              ...coinOperations[1],
              nftOperations: [erc721Operations[1], erc721Operations[2], erc1155Operations[1]],
            },
            {
              ...coinOperations[0],
              nftOperations: [erc721Operations[0], erc1155Operations[0]],
            },
          ];
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...account,
                operations,
              },
            },
            {} as any,
          );

          expect(accountShape).toEqual({
            type: "Account",
            id: account.id,
            syncHash: expect.stringMatching(/^0x[A-Fa-f0-9]{7,8}$/), // matching a 32 bits hex string (MurmurHash result)
            balance: new BigNumber(100),
            spendableBalance: new BigNumber(100),
            nfts: [nfts[0], nfts[1]],
            blockHeight: 6969,
            operations: [coinOperations[2], ...operations],
            operationsCount: 3,
            subAccounts: account.subAccounts,
            lastSyncDate: new Date("2014-04-21"),
          });
        });
      });

      describe("With pending operations", () => {
        beforeAll(() => {
          jest.spyOn(etherscanAPI?.default, "getLastOperations").mockImplementation(() =>
            Promise.resolve({
              lastCoinOperations: [],
              lastTokenOperations: [],
              lastNftOperations: [],
              lastInternalOperations: [],
            }),
          );
          jest
            .spyOn(synchronization, "getOperationStatus")
            .mockImplementation((currency, op) =>
              Promise.resolve(op.hash === coinOperations[0].hash ? coinOperations[0] : null),
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
                  coinOperations[0],
                  {
                    ...coinOperations[0],
                    hash: "0xN0tH4sH",
                    id: "js:2:ethereum:0xkvn:-0xN0tH4sH-OUT",
                  },
                ],
              },
            },
            {} as any,
          );

          expect(accountShape.operations).toEqual([coinOperations[0]]);
        });
      });
    });

    describe("getSubAccounts", () => {
      beforeEach(() => {
        jest.spyOn(nodeApi, "getTokenBalance").mockImplementation(async (a, b, contractAddress) => {
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
        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [tokenOperations[0], tokenOperations[1], tokenOperations[3]],
        );

        const expectedUsdcAccount = {
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperations[0], tokenOperations[1]],
          operationsCount: 2,
          starred: undefined,
          swapHistory: [],
        };
        const expectedUsdtAccount = {
          ...makeTokenAccount(account.freshAddress, tokenCurrencies[1]),
          balance: new BigNumber(2),
          spendableBalance: new BigNumber(2),
          operations: [tokenOperations[3]],
          operationsCount: 1,
          starred: undefined,
          swapHistory: [],
        };

        expect(tokenAccounts).toEqual([expectedUsdcAccount, expectedUsdtAccount]);
      });
    });

    describe("getSubAccountShape", () => {
      beforeEach(() => {
        jest.spyOn(nodeApi, "getTokenBalance").mockImplementation(async (a, b, contractAddress) => {
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
          tokenCurrencies[0],
          [tokenOperations[0], tokenOperations[1], tokenOperations[2]],
        );

        expect(subAccount).toEqual({
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperations[0], tokenOperations[1], tokenOperations[2]],
          operationsCount: 3,
          starred: undefined,
          swapHistory: [],
        });
      });
    });

    describe("getOperationStatus", () => {
      it("should not throw on fail", async () => {
        jest.spyOn(nodeApi, "getTransaction").mockImplementationOnce(() => {
          throw new Error();
        });

        const operationStatus = await synchronization.getOperationStatus(
          currency,
          coinOperations[0],
        );
        expect(operationStatus).toBe(null);
      });

      it("should return null if retrieved transaction has no blockHeight", async () => {
        jest.spyOn(nodeApi, "getTransaction").mockImplementationOnce(
          async () =>
            ({
              blockHash: "hash",
              timestamp: 101010010,
              nonce: 1,
            }) as any,
        );

        const operationStatus = await synchronization.getOperationStatus(
          currency,
          coinOperations[0],
        );
        expect(operationStatus).toBe(null);
      });

      it("should return the retrieved operation with network properties", async () => {
        jest.spyOn(nodeApi, "getTransaction").mockImplementationOnce(async () => ({
          hash: "0xTransactionHash",
          blockHeight: 10,
          blockHash: "hash",
          timestamp: Date.now(),
          nonce: 123,
        }));

        const expectedAddition = {
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: 123,
        };

        const operationStatus = await synchronization.getOperationStatus(currency, {
          ...coinOperations[0],
          subOperations: [tokenOperations[0]],
          nftOperations: [erc721Operations[0], erc1155Operations[0]],
        });

        expect(operationStatus).toEqual({
          ...coinOperations[0],
          ...expectedAddition,
          subOperations: [
            {
              ...tokenOperations[0],
              ...expectedAddition,
            },
          ],
          nftOperations: [
            { ...erc721Operations[0], ...expectedAddition },
            { ...erc1155Operations[0], ...expectedAddition },
          ],
        });
      });

      it("should return the retrieved operation with network properties even if the rpc doesn't return timestamp", async () => {
        jest.spyOn(nodeApi, "getTransaction").mockImplementationOnce(async () => ({
          hash: "0xTransactionHash",
          blockHeight: 10,
          blockHash: "hash",
          nonce: 123,
        }));
        jest
          .spyOn(nodeApi, "getBlockByHeight")
          .mockImplementationOnce(async () => ({ timestamp: Date.now() }) as any);

        const expectedAddition = {
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: 123,
        };

        const operationStatus = await synchronization.getOperationStatus(currency, {
          ...coinOperations[0],
          subOperations: [tokenOperations[0]],
          nftOperations: [erc721Operations[0], erc1155Operations[0]],
        });
        expect(operationStatus).toEqual({
          ...coinOperations[0],
          ...expectedAddition,
          subOperations: [
            {
              ...tokenOperations[0],
              ...expectedAddition,
            },
          ],
          nftOperations: [
            { ...erc721Operations[0], ...expectedAddition },
            { ...erc1155Operations[0], ...expectedAddition },
          ],
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
          synchronization.postSync({ ...account, subAccounts: [] }, accountWithTokenAccount),
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
        const accountWithoutPending = {
          ...accountWithPending,
          subAccounts: [tokenAccountWithPending],
          pendingOperations: [],
        };

        // should not change anything if we maintain the pending op
        expect(synchronization.postSync(accountWithPending, accountWithPending)).toEqual(
          accountWithPending,
        );
        // should keep pending ops even if the synced account(second parameter of postSync) has no pending op, because the pending op will be recalculated form the initial account
        expect(synchronization.postSync(accountWithPending, accountWithoutPending)).toEqual(
          accountWithPending,
        );

        // Should remove the pending from account if the pending operations become operations from main account
        const updateAccount = synchronization.postSync(accountWithPending, {
          ...accountWithPending,
          operations: [pendingOperation],
          pendingOperations: [],
        });
        expect(updateAccount.pendingOperations).toHaveLength(0);

        // Should remove the pending from tokenAccount if it was confirmed in the main account ops
        expect(updateAccount.subAccounts?.[0].pendingOperations).toHaveLength(0);
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
          }),
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
          date: new Date(new Date().getTime() + getEnv("OPERATION_OPTIMISTIC_RETENTION") + 1),
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
        expect(synchronization.postSync(accountWithTokenAccount, accountWithTokenAccount)).toEqual(
          account,
        );
      });
    });
  });
});

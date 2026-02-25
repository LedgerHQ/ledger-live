import { AssertionError, fail } from "assert";
import { decodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { setCryptoAssetsStore, getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getEnv } from "@ledgerhq/live-env";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCoinConfig } from "../config";
import { UnknownExplorer, UnknownNode } from "../errors";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import usdcTokenData from "../fixtures/ethereum-erc20-usd__coin.json";
import usdtTokenData from "../fixtures/ethereum-erc20-usd_tether__erc20_.json";
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
  swapHistory,
} from "../fixtures/synchronization.fixtures";
import { createSwapHistoryMap } from "../logic";
import * as logic from "../logic";
import * as etherscanAPI from "../network/explorer/etherscan";
import * as noneExplorer from "../network/explorer/none";
import * as nodeApi from "../network/node/rpc.common";
import * as synchronization from "./synchronization";

jest.mock("../network/node/rpc.common");

// Mock etherscan API module
jest.mock("../network/explorer/etherscan", () => {
  const actual = jest.requireActual("../network/explorer/etherscan");
  const mockGetLastOperations = Object.assign(jest.fn(), { reset: jest.fn() });
  return {
    __esModule: true,
    ...actual,
    getOperations: mockGetLastOperations,
    getCoinOperations: jest.fn(),
    getTokenOperations: jest.fn(),
    getNftOperations: jest.fn(),
    getInternalOperations: jest.fn(),
    getERC1155Operations: jest.fn(),
    getERC721Operations: jest.fn(),
    default: {
      explorerApi: {
        getOperations: mockGetLastOperations,
      },
      explorerApiNoCache: {
        getOperations: mockGetLastOperations,
      },
    },
  };
});

// Mock none explorer module
jest.mock("../network/explorer/none", () => {
  const mockGetLastOperations = jest.fn().mockResolvedValue({
    lastCoinOperations: [],
    lastTokenOperations: [],
    lastNftOperations: [],
    lastInternalOperations: [],
  });
  return {
    __esModule: true,
    ...jest.requireActual("../network/explorer/none"),
    getOperations: mockGetLastOperations,
    default: {
      getOperations: mockGetLastOperations,
    },
  };
});

// Mock logic module - keep actual implementation but allow getSyncHash to be mocked
jest.mock("../logic", () => {
  const actual = jest.requireActual("../logic");
  return {
    ...actual,
    getSyncHash: jest.fn(actual.getSyncHash),
  };
});

jest.useFakeTimers().setSystemTime(new Date("2014-04-21"));

jest.mock("../config");
const mockGetConfig = jest.mocked(getCoinConfig);

const getAccountShapeParameters: AccountShapeInfo = {
  address: "0xkvn",
  currency,
  derivationMode: "",
  derivationPath: "44'/60'/0'/0/0",
  index: 0,
};

describe("EVM Family", () => {
  let mockStore: CryptoAssetsStore;

  beforeAll(() => {
    mockStore = {
      findTokenById: async (id: string) => {
        if (id === "ethereum/erc20/usd__coin") {
          return tokenCurrencies[0];
        }
        if (id === "ethereum/erc20/usd_tether__erc20_") {
          return tokenCurrencies[1];
        }
        return undefined;
      },
      findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
        const normalizedAddress = address.toLowerCase();
        if (
          normalizedAddress === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" &&
          currencyId === "ethereum"
        ) {
          return tokenCurrencies[0];
        }
        if (
          normalizedAddress === "0xdac17f958d2ee523a2206206994597c13d831ec7" &&
          currencyId === "ethereum"
        ) {
          return tokenCurrencies[1];
        }
        return undefined;
      },
      getTokensSyncHash: async () => "",
    };
    setCryptoAssetsStore(mockStore);
  });

  beforeEach(() => {
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
          showNfts: true,
        },
      };
    });
  });

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
        mockGetConfig.mockImplementationOnce((): any => {
          return { info: {} };
        });

        try {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              currency: {
                ...currency,
                ethereumLikeInfo: undefined as any,
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
        mockGetConfig.mockImplementation((): any => {
          return {
            info: {
              node: {
                type: "external",
                uri: "https://my-rpc.com",
              },
              explorer: {
                uri: "http://nope.com",
                type: "unsupported" as any,
              },
              showNfts: true,
            },
          };
        });

        try {
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              currency: {
                ...currency,
                ethereumLikeInfo: {
                  chainId: 1,
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
          expect(e).toBeInstanceOf(UnknownExplorer);
        }
      });

      it("shouldn't throw for none explorer config", async () => {
        mockGetConfig.mockImplementation((): any => {
          return {
            info: {
              node: {
                type: "external",
                uri: "https://my-rpc.com",
              },
              explorer: {
                type: "none",
              },
              showNfts: true,
            },
          };
        });
        const spy = jest.spyOn(noneExplorer?.default, "getOperations");

        await synchronization.getAccountShape(
          {
            ...getAccountShapeParameters,
            currency: {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              } as any,
            },
          },
          {} as any,
        );

        expect(spy).toHaveBeenCalledTimes(1);
        // The spy should have been called and returned successfully
        await expect(spy.mock.results[0].value).resolves.toEqual({
          lastCoinOperations: [],
          lastTokenOperations: [],
          lastNftOperations: [],
          lastInternalOperations: [],
        });
      });

      describe("With no transactions fetched", () => {
        beforeAll(() => {
          // @ts-expect-error reseting cache
          etherscanAPI?.default.explorerApi.getOperations.reset();
          jest.spyOn(etherscanAPI, "getOperations").mockImplementation(() =>
            Promise.resolve({
              lastCoinOperations: [],
              lastTokenOperations: [],
              lastNftOperations: [],
              lastInternalOperations: [],
              nextPagingToken: "",
            }),
          );
          jest.spyOn(etherscanAPI?.default.explorerApi, "getOperations").mockImplementation(() =>
            Promise.resolve({
              lastCoinOperations: [],
              lastTokenOperations: [],
              lastNftOperations: [],
              lastInternalOperations: [],
              nextPagingToken: "",
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
          const syncHash = await logic.getSyncHash(currency);
          const initialAccount = {
            ...makeAccount("0xkvn", currency, [tokenAccount]),
            syncHash,
          };
          const accountWithSubAccount = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...initialAccount,
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
          jest.spyOn(logic, "getSyncHash").mockResolvedValueOnce("0xNope");

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

          expect(etherscanAPI?.default.explorerApi.getOperations).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            0,
            6969,
          );
        });

        it("should do an incremental sync when syncHash is identical", async () => {
          const syncHash = await logic.getSyncHash(currency);
          const initialAccount = {
            ...makeAccount("0xkvn", currency, [tokenAccount]),
            syncHash,
          };
          await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...initialAccount,
                blockHeight: 123,
                operations: [coinOperations[2]],
                subAccounts: [{ ...tokenAccount, operations: [tokenOperations[0]] }],
              },
            },
            {} as any,
          );

          expect(etherscanAPI?.default.explorerApi.getOperations).toHaveBeenCalledWith(
            getAccountShapeParameters.currency,
            getAccountShapeParameters.address,
            account.id,
            123 - synchronization.SAFE_REORG_THRESHOLD,
            6969,
          );
        });
      });

      describe("With transactions fetched", () => {
        beforeAll(() => {
          // Mock getOperations to return combined operations data
          (etherscanAPI.default.explorerApi.getOperations as jest.Mock).mockResolvedValue({
            lastCoinOperations: [{ ...coinOperations[0] }, { ...coinOperations[1] }],
            lastTokenOperations: [{ ...tokenOperations[0] }, { ...tokenOperations[1] }],
            lastNftOperations: [
              { ...erc721Operations[0] },
              { ...erc721Operations[1] },
              { ...erc721Operations[2] },
              { ...erc1155Operations[0] },
              { ...erc1155Operations[1] },
            ],
            lastInternalOperations: [
              { ...internalOperations[0] },
              { ...internalOperations[1] },
              { ...internalOperations[2] },
            ],
            nextPagingToken: "",
          });
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
          const syncHash = await logic.getSyncHash(currency);
          const initialAccount = {
            ...makeAccount("0xkvn", currency, [tokenAccount]),
            syncHash,
          };
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount,
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
              transactionSequenceNumber: new BigNumber(0),
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
          jest
            .spyOn(etherscanAPI?.default.explorerApi, "getOperations")
            .mockImplementationOnce(async () => ({
              lastTokenOperations: [],
              lastNftOperations: [],
              lastCoinOperations: [coinOperations[2]],
              lastInternalOperations: [],
              nextPagingToken: "",
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

          const syncHash = await logic.getSyncHash(currency);
          const initialAccount = {
            ...makeAccount("0xkvn", currency, [tokenAccount]),
            syncHash,
          };

          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...initialAccount,
                operations,
              },
            },
            {} as any,
          );

          expect(accountShape).toEqual({
            type: "Account",
            id: initialAccount.id,
            syncHash: expect.stringMatching(/^0x[A-Fa-f0-9]{7,8}$/), // matching a 32 bits hex string (MurmurHash result)
            balance: new BigNumber(100),
            spendableBalance: new BigNumber(100),
            nfts: [nfts[0], nfts[1]],
            blockHeight: 6969,
            operations: [coinOperations[2], ...operations],
            operationsCount: 3,
            subAccounts: initialAccount.subAccounts,
            lastSyncDate: new Date("2014-04-21"),
          });
        });

        it("should return a partial account with filtered token accounts and token operations", async () => {
          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: account,
            },
            { blacklistedTokenIds: [tokenCurrencies[0].id] } as any,
          );

          const syncHash = await logic.getSyncHash(account.currency, [tokenCurrencies[0].id]);
          expect(accountShape).toEqual({
            type: "Account",
            id: account.id,
            syncHash,
            balance: new BigNumber(100),
            spendableBalance: new BigNumber(100),
            nfts: [nfts[0], nfts[1]],
            blockHeight: 6969,
            operations: [
              {
                ...coinOperations[0],
                subOperations: [],
                nftOperations: [erc721Operations[0], erc1155Operations[0]],
                internalOperations: [internalOperations[0]],
              },
              {
                ...coinOperations[1],
                nftOperations: [erc721Operations[1], erc721Operations[2], erc1155Operations[1]],
                internalOperations: [internalOperations[1]],
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
                transactionSequenceNumber: new BigNumber(0),
                extra: {},
              },
            ],
            operationsCount: 3,
            subAccounts: [],
            lastSyncDate: new Date("2014-04-21"),
          });
        });
      });

      describe("With pending operations", () => {
        beforeAll(() => {
          (etherscanAPI.default.getOperations as jest.Mock).mockResolvedValue({
            lastCoinOperations: [],
            lastTokenOperations: [],
            lastNftOperations: [],
            lastInternalOperations: [],
            nextPagingToken: "",
          });
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        // NOTE: This test requires mocking internal function calls which is not supported
        // with SWC-compiled ES modules. The test is skipped but the functionality is
        // covered by integration tests.
        it.skip("should add the confirmed pending operation to the operations", async () => {
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

      describe("With Blockscout", () => {
        beforeAll(() => {
          // Mock getOperations for blockscout explorer
          (etherscanAPI.default.explorerApi.getOperations as jest.Mock).mockResolvedValue({
            lastCoinOperations: [{ ...coinOperations[0] }, { ...coinOperations[1] }],
            lastTokenOperations: [{ ...tokenOperations[0] }, { ...tokenOperations[1] }],
            lastNftOperations: [
              { ...erc721Operations[0] },
              { ...erc721Operations[1] },
              { ...erc721Operations[2] },
            ],
            lastInternalOperations: [
              { ...internalOperations[0] },
              { ...internalOperations[1] },
              { ...internalOperations[2] },
            ],
            nextPagingToken: "",
          });
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

        it("should use blockscout explorer configuration", async () => {
          mockGetConfig.mockImplementation((): any => {
            return {
              info: {
                node: {
                  type: "external",
                  uri: "https://my-rpc.com",
                },
                explorer: {
                  type: "blockscout",
                  uri: "https://api.com",
                },
                showNfts: true,
              },
            };
          });

          const accountShape = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: account,
            },
            {} as any,
          );

          // Verify the mock was called
          expect(etherscanAPI.default.explorerApi.getOperations).toHaveBeenCalled();
          expect(typeof accountShape.id).toBe("string");
        });
      });
    });

    describe("getSubAccounts", () => {
      beforeEach(() => {
        jest.spyOn(nodeApi, "getTokenBalance").mockImplementation(async (a, b, contractAddress) => {
          const normalizedAddress = contractAddress.toLowerCase();
          switch (normalizedAddress) {
            case "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": // usdc
              return new BigNumber(1);
            case "0xdac17f958d2ee523a2206206994597c13d831ec7": // usdt
              return new BigNumber(2);
            default:
              return new BigNumber(0);
          }
        });
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return the right subAccounts, excluding tokens unknown by the CAL and recomputing operations `id` and `accountId`", async () => {
        const findTokenByAddressInCurrency = jest.spyOn(mockStore, "findTokenByAddressInCurrency");
        const swapHistoryMap = createSwapHistoryMap(account);
        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [
            tokenOperations[0],
            tokenOperations[1],
            { contract: "unknown-contract" } as Operation, // Won't be used to build sub accounts
            tokenOperations[3],
          ],
          undefined,
          swapHistoryMap,
          async (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        const usdcAccountId = encodeTokenAccountId(account.id, usdcTokenData as TokenCurrency);
        const expectedUsdcAccount = {
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [
            {
              ...tokenOperations[0],
              id: encodeOperationId(
                usdcAccountId,
                tokenOperations[0].hash,
                tokenOperations[0].type,
              ),
              accountId: usdcAccountId,
            },
            {
              ...tokenOperations[1],
              id: encodeOperationId(
                usdcAccountId,
                tokenOperations[1].hash,
                tokenOperations[1].type,
              ),
              accountId: usdcAccountId,
            },
          ],
          operationsCount: 2,
          swapHistory,
        };
        const usdtAccountId = encodeTokenAccountId(account.id, usdtTokenData as TokenCurrency);
        const expectedUsdtAccount = {
          ...makeTokenAccount(account.freshAddress, tokenCurrencies[1]),
          balance: new BigNumber(2),
          spendableBalance: new BigNumber(2),
          operations: [
            {
              ...tokenOperations[3],
              id: encodeOperationId(
                usdtAccountId,
                tokenOperations[3].hash,
                tokenOperations[3].type,
              ),
              accountId: usdtAccountId,
            },
          ],
          operationsCount: 1,
          swapHistory: [],
        };

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "ethereum",
        );
        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "ethereum",
        );
        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-contract", "ethereum");
        expect(tokenAccounts).toEqual([expectedUsdcAccount, expectedUsdtAccount]);
      });

      it("should return the right subAccounts when CAL has changed", async () => {
        const findTokenByAddressInCurrency = jest.spyOn(mockStore, "findTokenByAddressInCurrency");

        findTokenByAddressInCurrency.mockImplementation(
          (address: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
            if (address === tokenOperations[0].contract) {
              return Promise.resolve(tokenCurrencies[0]);
            }

            return Promise.resolve(undefined);
          },
        );

        const swapHistoryMap = createSwapHistoryMap(account);
        let tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [
            tokenOperations[0],
            tokenOperations[1],
            { contract: "unknown-contract" } as Operation, // Won't be used to build sub accounts
            tokenOperations[3],
          ],
          undefined,
          swapHistoryMap,
          (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        const usdcAccountId = encodeTokenAccountId(account.id, usdcTokenData as TokenCurrency);
        const expectedUsdcAccount = {
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [
            {
              ...tokenOperations[0],
              id: encodeOperationId(
                usdcAccountId,
                tokenOperations[0].hash,
                tokenOperations[0].type,
              ),
              accountId: usdcAccountId,
            },
            {
              ...tokenOperations[1],
              id: encodeOperationId(
                usdcAccountId,
                tokenOperations[1].hash,
                tokenOperations[1].type,
              ),
              accountId: usdcAccountId,
            },
          ],
          operationsCount: 2,
          swapHistory,
        };

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[0].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[1].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[3].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-contract", "ethereum");
        expect(tokenAccounts).toEqual([expectedUsdcAccount]);

        findTokenByAddressInCurrency.mockClear();
        findTokenByAddressInCurrency.mockImplementation(
          (address: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
            if (address === tokenOperations[3].contract) {
              return Promise.resolve(tokenCurrencies[1]);
            }

            return Promise.resolve(undefined);
          },
        );

        tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [
            tokenOperations[0],
            tokenOperations[1],
            { contract: "unknown-contract" } as Operation, // Won't be used to build sub accounts
            tokenOperations[3],
          ],
          undefined,
          swapHistoryMap,
          (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        const usdtAccountId = encodeTokenAccountId(account.id, usdtTokenData as TokenCurrency);
        const expectedUsdtAccount = {
          ...makeTokenAccount(account.freshAddress, tokenCurrencies[1]),
          balance: new BigNumber(2),
          spendableBalance: new BigNumber(2),
          operations: [
            {
              ...tokenOperations[3],
              id: encodeOperationId(
                usdtAccountId,
                tokenOperations[3].hash,
                tokenOperations[3].type,
              ),
              accountId: usdtAccountId,
            },
          ],
          operationsCount: 1,
          swapHistory: [],
        };

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[0].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[1].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[3].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-contract", "ethereum");
        expect(tokenAccounts).toEqual([expectedUsdtAccount]);

        findTokenByAddressInCurrency.mockClear();
        findTokenByAddressInCurrency.mockImplementation(
          (address: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
            if (address === tokenOperations[0].contract) {
              return Promise.resolve(tokenCurrencies[0]);
            } else if (address === tokenOperations[1].contract) {
              return Promise.resolve(tokenCurrencies[1]);
            } else if (address === tokenOperations[3].contract) {
              return Promise.resolve(tokenCurrencies[1]);
            }

            return Promise.resolve(undefined);
          },
        );

        tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [
            tokenOperations[0],
            tokenOperations[1],
            { contract: "unknown-contract" } as Operation, // Won't be used to build sub accounts
            tokenOperations[3],
          ],
          undefined,
          swapHistoryMap,
          (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[0].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[1].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[3].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-contract", "ethereum");
        expect(tokenAccounts).toEqual([expectedUsdcAccount, expectedUsdtAccount]);
      });

      it("should return no subAccounts when CAL do not return tokens", async () => {
        const findTokenByAddressInCurrency = jest.spyOn(mockStore, "findTokenByAddressInCurrency");

        findTokenByAddressInCurrency.mockImplementation(
          (_address: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
            return Promise.resolve(undefined);
          },
        );

        const swapHistoryMap = createSwapHistoryMap(account);
        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [
            tokenOperations[0],
            tokenOperations[1],
            { contract: "unknown-contract" } as Operation, // Won't be used to build sub accounts
            tokenOperations[3],
          ],
          undefined,
          swapHistoryMap,
          (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[0].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[1].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
          tokenOperations[3].contract,
          "ethereum",
        );

        expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-contract", "ethereum");
        expect(tokenAccounts).toEqual([]);
      });

      it("should return filtered subAccounts from blacklistedTokenIds, recomputing operations `id` and `accountId`", async () => {
        const swapHistoryMap = new Map<string, TokenAccount["swapHistory"]>();
        const tokenAccounts = await synchronization.getSubAccounts(
          {
            ...getAccountShapeParameters,
            initialAccount: account,
          },
          account.id,
          [tokenOperations[0], tokenOperations[1], tokenOperations[3]],
          [tokenCurrencies[0].id],
          swapHistoryMap,
          async (contractAddress: string) =>
            getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, "ethereum"),
        );

        const usdtAccountId = encodeTokenAccountId(account.id, usdtTokenData as TokenCurrency);
        const expectedUsdtAccount = {
          ...makeTokenAccount(account.freshAddress, tokenCurrencies[1]),
          balance: new BigNumber(2),
          spendableBalance: new BigNumber(2),
          operations: [
            {
              ...tokenOperations[3],
              id: encodeOperationId(
                usdtAccountId,
                tokenOperations[3].hash,
                tokenOperations[3].type,
              ),
              accountId: usdtAccountId,
            },
          ],
          operationsCount: 1,
          swapHistory: [],
        };

        expect(tokenAccounts).toEqual([expectedUsdtAccount]);
      });
    });

    describe("getSubAccountShape", () => {
      beforeEach(() => {
        jest.spyOn(nodeApi, "getTokenBalance").mockImplementation(async (a, b, contractAddress) => {
          const normalizedAddress = contractAddress.toLowerCase();
          switch (normalizedAddress) {
            case "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": // usdc
              return new BigNumber(1);
            case "0xdac17f958d2ee523a2206206994597c13d831ec7": // usdt
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
          [],
        );

        expect(subAccount).toEqual({
          ...tokenAccount,
          balance: new BigNumber(1),
          spendableBalance: new BigNumber(1),
          operations: [tokenOperations[0], tokenOperations[1], tokenOperations[2]],
          operationsCount: 3,
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
          gasPrice: "0",
          gasUsed: "0",
          value: "0",
          status: 1,
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        }));

        const expectedAddition = {
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: new BigNumber(123),
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
          gasPrice: "0",
          gasUsed: "0",
          value: "0",
          status: 1,
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        }));
        jest
          .spyOn(nodeApi, "getBlockByHeight")
          .mockImplementationOnce(async () => ({ timestamp: Date.now() }) as any);

        const expectedAddition = {
          blockHash: "hash",
          blockHeight: 10,
          date: new Date(),
          transactionSequenceNumber: new BigNumber(123),
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

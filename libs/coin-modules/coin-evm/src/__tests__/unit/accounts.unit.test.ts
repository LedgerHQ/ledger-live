import BigNumber from "bignumber.js";
import axios, { AxiosResponse } from "axios";
import { tokens as localTokensByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { __clearAllLists } from "@ledgerhq/cryptoassets/tokens";
import * as etherscanAPI from "../../api/explorer/etherscan";
import { __resetCALHash, getCALHash } from "../../logic";
import { getAccountShape } from "../../synchronization";
import * as nodeApi from "../../api/node/rpc.common";
import { preload, hydrate } from "../../preload";
import { getCoinConfig } from "../../config";
import {
  currency,
  fakeToken,
  getAccountShapeParameters,
  NTMTransaction,
  TMUSDTTransaction,
} from "../fixtures/accounts.fixtures";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);
mockedAxios.AxiosError = jest.requireActual("axios").AxiosError;

jest.mock("../../api/node/rpc.common");
jest.useFakeTimers().setSystemTime(new Date("2014-04-21"));
jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  describe("Account synchronization with currency preloading", () => {
    beforeEach(() => {
      jest.restoreAllMocks();

      __clearAllLists();
      __resetCALHash();

      jest.spyOn(etherscanAPI?.default, "getLastOperations").mockImplementation(() =>
        Promise.resolve({
          lastCoinOperations: [],
          lastTokenOperations: [TMUSDTTransaction, NTMTransaction],
          lastNftOperations: [],
          lastInternalOperations: [],
        }),
      );
      jest.spyOn(nodeApi, "getCoinBalance").mockImplementation(async () => new BigNumber(100));
      jest.spyOn(nodeApi, "getTokenBalance").mockImplementation(async () => new BigNumber(200));
      jest.spyOn(nodeApi, "getBlockByHeight").mockImplementation(async () => ({
        hash: "blockHash6969",
        height: 6969,
        timestamp: Date.now(),
      }));
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

    it("should add an account and find no token account without a preload first", async () => {
      const { subAccounts } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });

      expect(subAccounts).toEqual([]);
    });

    it("should preload currency and add an account with 1 token account in it when there is nothing new in remote CAL", async () => {
      mockedAxios.get.mockImplementationOnce(() => {
        throw new axios.AxiosError("", "", undefined, undefined, { status: 304 } as AxiosResponse);
      });

      await preload(currency);
      const { subAccounts } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });

      expect(subAccounts?.length).toBe(1);
      expect(decodeTokenAccountId(subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
    });

    it("should preload currency and add an account with 2 token accounts in it when there is an updated remote CAL", async () => {
      mockedAxios.get.mockImplementationOnce(async (url, { params } = {}) => {
        if (
          url === "https://crypto-assets-service.api.ledger.com/v1/tokens" &&
          params.chain_id === currency.ethereumLikeInfo!.chainId
        ) {
          return {
            data: [
              ...localTokensByChainId[
                currency.ethereumLikeInfo!.chainId as keyof typeof localTokensByChainId
              ],
              fakeToken,
            ].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["x-ledger-next"]: "", ["etag"]: "newHash" },
          };
        }
      });
      await preload(currency);
      const { subAccounts } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });

      expect(subAccounts?.length).toBe(2);
      expect(decodeTokenAccountId(subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
      expect(decodeTokenAccountId(subAccounts![1]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/new_token_mock",
      );
    });

    it("should preload again a currency and get the same account with 2 tokens accounts", async () => {
      mockedAxios.get.mockImplementationOnce(async (url, { params } = {}) => {
        if (
          url === "https://crypto-assets-service.api.ledger.com/v1/tokens" &&
          params.chain_id === currency.ethereumLikeInfo!.chainId
        ) {
          return {
            data: [
              ...localTokensByChainId[
                currency.ethereumLikeInfo!.chainId as keyof typeof localTokensByChainId
              ],
              fakeToken,
            ].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["x-ledger-next"]: "", ["etag"]: "newHash" },
          };
        }
      });
      await preload(currency);
      const { subAccounts } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });

      expect(getCALHash(currency)).toBe("newHash");

      mockedAxios.get.mockImplementationOnce((url, params = {}) => {
        if (params.headers?.["If-None-Match"] === "newHash") {
          throw new axios.AxiosError("", "", undefined, undefined, {
            status: 304,
          } as AxiosResponse);
        } else {
          throw new Error("unexpected");
        }
      });

      await preload(currency);
      const { subAccounts: subAccounts2 } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });

      expect(getCALHash(currency)).toBe("newHash");
      expect(subAccounts?.length).toBe(2);
      expect(decodeTokenAccountId(subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
      expect(decodeTokenAccountId(subAccounts![1]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/new_token_mock",
      );
      expect(subAccounts).toEqual(subAccounts2);
    });

    it("should preload again a currency and get the same account with 2 tokens accounts even with a failing CAL service", async () => {
      mockedAxios.get.mockImplementationOnce(async (url, { params } = {}) => {
        if (
          url === "https://crypto-assets-service.api.ledger.com/v1/tokens" &&
          params.chain_id === currency.ethereumLikeInfo!.chainId
        ) {
          return {
            data: [
              ...localTokensByChainId[
                currency.ethereumLikeInfo!.chainId as keyof typeof localTokensByChainId
              ],
            ].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["x-ledger-next"]: "", ["etag"]: "newHash" },
          };
        }
      });

      await preload(currency);
      const { subAccounts } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });
      expect(getCALHash(currency)).toBe("newHash");

      mockedAxios.get.mockImplementationOnce(async () => {
        throw new Error();
      });

      await preload(currency);
      const { subAccounts: subAccounts2 } = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      });
      // Should maintain the hash from the last tokens fetched
      expect(getCALHash(currency)).toBe("newHash");

      expect(subAccounts?.length).toBe(1);
      expect(decodeTokenAccountId(subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
      expect(subAccounts).toEqual(subAccounts2);
    });

    it("should hydrate the tokens necessary to deserialize an account with 1 token account when there is nothing new in remote CAL", async () => {
      const preloaded = await preload(currency);
      await hydrate(preloaded, currency);
      const account = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      }).then(account => ({
        ...account,
        creationDate: new Date(),
        pendingOperations: [],
        currency,
      }));
      const serializedAccount = toAccountRaw(account as any);

      __clearAllLists();
      await hydrate(preloaded, currency);

      const deserializeAccount = fromAccountRaw(serializedAccount);

      expect(deserializeAccount.subAccounts?.length).toBe(1);
      expect(decodeTokenAccountId(deserializeAccount.subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
    });

    it("should hydrate the tokens necessary to deserialize an account with 2 token accounts when there is an updated remote CAL", async () => {
      mockedAxios.get.mockImplementationOnce(async (url, { params } = {}) => {
        if (
          url === "https://crypto-assets-service.api.ledger.com/v1/tokens" &&
          params.chain_id === currency.ethereumLikeInfo!.chainId
        ) {
          return {
            data: [
              ...localTokensByChainId[
                currency.ethereumLikeInfo!.chainId as keyof typeof localTokensByChainId
              ],
              fakeToken,
            ].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["x-ledger-next"]: "", etag: "anyHash" },
          };
        }
      });
      const preloaded = await preload(currency);
      await hydrate(preloaded, currency);
      const account = await getAccountShape(getAccountShapeParameters, {
        paginationConfig: {},
      }).then(account => ({
        ...account,
        creationDate: new Date(),
        pendingOperations: [],
        currency,
      }));
      const serializedAccount = toAccountRaw(account as any);

      __clearAllLists();
      await hydrate(preloaded, currency);

      const deserializeAccount = fromAccountRaw(serializedAccount);

      expect(deserializeAccount.subAccounts?.length).toBe(2);
      expect(decodeTokenAccountId(deserializeAccount.subAccounts![0]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/mock_usdt",
      );
      expect(decodeTokenAccountId(deserializeAccount.subAccounts![1]?.id).token?.id).toBe(
        "scroll_sepolia/erc20/new_token_mock",
      );
    });
  });
});

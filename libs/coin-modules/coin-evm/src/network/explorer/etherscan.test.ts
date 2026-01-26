import { AssertionError, fail } from "assert";
import axios from "axios";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EtherscanLikeExplorerUsedIncorrectly } from "../../errors";
import { makeAccount } from "../../fixtures/common.fixtures";
import {
  etherscanERC1155EventToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanInternalTransactionToOperations,
  etherscanOperationToOperations,
} from "../../adapters";
import { getCoinConfig } from "../../config";
import {
  etherscanCoinOperations,
  etherscanERC1155Operations,
  etherscanERC721Operations,
  etherscanInternalOperations,
  etherscanTokenOperations,
} from "../../fixtures/etherscan.fixtures";
import * as ETHERSCAN_API from "./etherscan";
import { deserializePagingToken, serializePagingToken } from "./etherscan";
import { NO_TOKEN } from "./types";

setupMockCryptoAssetsStore({
  getTokensSyncHash: async () => "0",
});

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

const currency: CryptoCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
  },
};

const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency);

describe("EVM Family", () => {
  beforeEach(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        info: {
          explorer: {
            type: "etherscan",
            uri: "mock",
          },
          node: {
            type: "external",
            uri: "mock",
          },
          showNfts: true,
        },
      };
    });
  });

  describe("network/explorer/etherscan.ts", () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe("fetchWithRetries", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should retry on fail", async () => {
        let retries = 2;
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new Error();
          }
          return { data: { result: true } };
        });
        const response = await ETHERSCAN_API.fetchWithRetries({}, retries);

        expect(response).toBe(true);
        // it should fail 2 times and succeed on the next try
        expect(spy).toHaveBeenCalledTimes(3);
      });

      it("should throw after too many retries", async () => {
        const SpyError = class SpyError extends Error {};

        let retries = ETHERSCAN_API.DEFAULT_RETRIES_API + 1;
        jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new SpyError();
          }
          return { data: { result: true } };
        });
        try {
          await ETHERSCAN_API.fetchWithRetries({});
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(SpyError);
        }
      });

      it("should also retry if the Etherscan reponse is a 200 w/ a NOTOK message (used for rate limit)", async () => {
        let retries = 2;
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            return { data: { message: "NOTOK" } };
          }
          return { data: { result: true } };
        });
        const response = await ETHERSCAN_API.fetchWithRetries({}, retries);

        expect(response).toBe(true);
        // it should fail 2 times and succeed on the next try
        expect(spy).toHaveBeenCalledTimes(3);
      });
    });

    describe("getLastCoinOperations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should throw an error if the currency is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          // no explorer
          return {
            info: {
              node: {
                type: "external",
                uri: "mock",
              },
            },
          };
        });

        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanCoinOperations,
          },
        }));

        try {
          await ETHERSCAN_API.getLastCoinOperations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              },
            },
            account.freshAddress,
            account.id,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
        }
      });

      it("should return a flat list of coin transactions from block 0", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanCoinOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.operations.length).toBe(4);
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlist&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 0,
          },
        });
      });

      it("should return a flat list of coin transactions from block 50", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanCoinOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response.operations).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.operations.length).toBe(4);
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlist&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
          },
        });
      });

      it("should return a flat list of coin transactions from block 50 to block 100", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanCoinOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response.operations).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.operations.length).toBe(4);
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlist&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
            endBlock: 100,
          },
        });
      });
    });

    describe("getLastTokenOperations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should throw if the currency is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          // no explorer
          return {
            info: {
              node: {
                type: "external",
                uri: "mock",
              },
            },
          };
        });

        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanTokenOperations,
          },
        }));

        try {
          await ETHERSCAN_API.getLastTokenOperations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              },
            },
            account.freshAddress,
            account.id,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
        }
      });

      it("should return a flat list of token transactions from block 0", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanTokenOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokentx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 0,
          },
        });
      });

      it("should return a flat list of token transactions from block 50", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanTokenOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokentx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
          },
        });
      });

      it("should return a flat list of token transactions from block 50 to block 100", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanTokenOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokentx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
            endBlock: 100,
          },
        });
      });
    });

    describe("getLastERC721Operations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should return an empty array if the currency is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          // no explorer
          return {
            info: {
              node: {
                type: "external",
                uri: "mock",
              },
            },
          };
        });

        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC721Operations,
          },
        }));

        try {
          await ETHERSCAN_API.getLastERC721Operations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              },
            },
            account.freshAddress,
            account.id,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
        }
      });

      it("should return a flat list of erc721 transactions from block 0", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC721Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokennfttx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 0,
          },
        });
      });

      it("should return a flat list of erc721 transactions from block 50", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC721Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokennfttx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
          },
        });
      });

      it("should return a flat list of erc721 transactions from block 50 to block 100", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC721Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=tokennfttx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
            endBlock: 100,
          },
        });
      });
    });

    describe("getLastERC1155Operations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should return an empty array if the currency is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          // no explorer
          return {
            info: {
              node: {
                type: "external",
                uri: "mock",
              },
            },
          };
        });

        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC721Operations,
          },
        }));

        try {
          await ETHERSCAN_API.getLastERC1155Operations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              },
            },
            account.freshAddress,
            account.id,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
        }
      });

      it("should return a flat list of erc1155 transactions from block 0", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC1155Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=token1155tx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 0,
          },
        });
      });

      it("should return a flat list of erc1155 transactions from block 50", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC1155Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=token1155tx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
          },
        });
      });

      it("should return a flat list of erc1155 transactions from block 50 to block 100", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanERC1155Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response.operations).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=token1155tx&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
            endBlock: 100,
          },
        });
      });
    });

    describe("getLastNftOperations", () => {
      it("should return a sorted array of nft transactions", async () => {
        jest.spyOn(axios, "request").mockImplementation(async params => ({
          data: {
            result: params.url?.includes("tokennfttx")
              ? etherscanERC721Operations
              : etherscanERC1155Operations,
          },
        }));

        const response = await ETHERSCAN_API.getLastNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          response.operations.slice().sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
      });
    });

    describe("getLastInternalOperations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should throw if the currency is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          // no explorer
          return {
            info: {
              node: {
                type: "external",
                uri: "mock",
              },
            },
          };
        });

        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanInternalOperations,
          },
        }));

        try {
          await ETHERSCAN_API.getLastInternalOperations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
              },
            },
            account.freshAddress,
            account.id,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
        }
      });

      it("should return a flat list of internal transactions from block 0", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanInternalOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response.operations).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlistinternal&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 0,
          },
        });
      });

      it("should return a flat list of internal transactions from block 50", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanInternalOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response.operations).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlistinternal&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
          },
        });
      });

      it("should return a flat list of internal transactions from block 50 to block 100", async () => {
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanInternalOperations,
          },
        }));

        const response = await ETHERSCAN_API.getLastInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response.operations).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toHaveBeenCalledWith({
          method: "GET",
          url: `mock?module=account&action=txlistinternal&address=${account.freshAddress}`,
          params: {
            tag: "latest",
            page: 1,
            sort: "desc",
            startBlock: 50,
            endBlock: 100,
          },
        });
      });
    });

    describe("getLastNftOperations without nft", () => {
      beforeEach(() => {
        mockGetConfig.mockImplementation((): any => {
          return {
            info: {
              explorer: {
                type: "etherscan",
                uri: "mock",
              },
              node: {
                type: "external",
                uri: "mock",
              },
              showNfts: false,
            },
          };
        });
      });

      it("should not return NFT opperation", async () => {
        const response = await ETHERSCAN_API.getLastNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );
        expect(response.operations).toEqual([]);
      });
    });
  });
});

describe("Etherscan pagination helpers", () => {
  describe("deserializePagingToken", () => {
    it("returns default state when token is undefined", () => {
      expect(deserializePagingToken(undefined, 100)).toEqual({
        coin: { lastBlock: 100, done: false },
        internal: { lastBlock: 100, done: false },
        token: { lastBlock: 100, done: false },
        nft: { lastBlock: 100, done: false },
      });
    });

    it("returns default state when token is empty string", () => {
      expect(deserializePagingToken("", 50)).toEqual({
        coin: { lastBlock: 50, done: false },
        internal: { lastBlock: 50, done: false },
        token: { lastBlock: 50, done: false },
        nft: { lastBlock: 50, done: false },
      });
    });

    it("throws when token is invalid base64", () => {
      expect(() => deserializePagingToken("not-valid-base64!!!", 200)).toThrow();
    });

    it("throws when token is valid base64 but invalid JSON", () => {
      const invalidJson = Buffer.from("not json").toString("base64");
      expect(() => deserializePagingToken(invalidJson, 300)).toThrow();
    });

    it("deserializes valid token correctly", () => {
      const state = {
        coin: { lastBlock: 1000, done: true },
        internal: { lastBlock: 500, done: false },
        token: { lastBlock: 750, done: true },
        nft: { lastBlock: 600, done: false },
      };
      const token = Buffer.from(JSON.stringify(state)).toString("base64");

      expect(deserializePagingToken(token, 0)).toEqual(state);
    });
  });

  describe("serializePagingToken", () => {
    it("returns NO_TOKEN when all endpoints are done", () => {
      const state = {
        coin: { lastBlock: 1000, done: true },
        internal: { lastBlock: 500, done: true },
        token: { lastBlock: 750, done: true },
        nft: { lastBlock: 600, done: true },
      };

      expect(serializePagingToken(state)).toBe(NO_TOKEN);
    });

    it("returns serialized token when at least one endpoint is not done", () => {
      const state = {
        coin: { lastBlock: 1000, done: true },
        internal: { lastBlock: 500, done: false },
        token: { lastBlock: 750, done: true },
        nft: { lastBlock: 600, done: true },
      };

      const result = serializePagingToken(state);

      // Verify it's valid base64 and can be deserialized back to original state
      expect(JSON.parse(Buffer.from(result, "base64").toString("utf-8"))).toEqual(state);
    });

    it("serializes and deserializes roundtrip correctly", () => {
      const state = {
        coin: { lastBlock: 12345, done: false },
        internal: { lastBlock: 12340, done: true },
        token: { lastBlock: 12350, done: false },
        nft: { lastBlock: 12330, done: false },
      };

      const token = serializePagingToken(state);
      expect(deserializePagingToken(token, 0)).toEqual(state);
    });
  });

  describe("pagination token lifecycle", () => {
    it("first call creates token with initial minHeight", () => {
      expect(deserializePagingToken(undefined, 1000)).toEqual({
        coin: { lastBlock: 1000, done: false },
        internal: { lastBlock: 1000, done: false },
        token: { lastBlock: 1000, done: false },
        nft: { lastBlock: 1000, done: false },
      });
    });

    it("subsequent calls use lastBlock from token", () => {
      const state = {
        coin: { lastBlock: 5000, done: false },
        internal: { lastBlock: 4500, done: false },
        token: { lastBlock: 4800, done: true },
        nft: { lastBlock: 4600, done: false },
      };
      const token = serializePagingToken(state);

      // Deserialize with different minHeight - should use token values
      expect(deserializePagingToken(token, 1000)).toEqual(state);
    });

    it("final call returns NO_TOKEN when all done", () => {
      const state = {
        coin: { lastBlock: 10000, done: true },
        internal: { lastBlock: 10000, done: true },
        token: { lastBlock: 10000, done: true },
        nft: { lastBlock: 10000, done: true },
      };

      expect(serializePagingToken(state)).toBe(NO_TOKEN);
    });
  });
});

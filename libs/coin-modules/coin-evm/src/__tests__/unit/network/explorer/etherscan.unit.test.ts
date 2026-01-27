import { AssertionError, fail } from "assert";
import axios from "axios";
import BigNumber from "bignumber.js";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EtherscanLikeExplorerUsedIncorrectly } from "../../../../errors";
import * as ETHERSCAN_API from "../../../../network/explorer/etherscan";
import { makeAccount } from "../../../fixtures/common.fixtures";
import {
  etherscanCoinOperations,
  etherscanERC1155Operations,
  etherscanERC721Operations,
  etherscanInternalOperations,
  etherscanTokenOperations,
} from "../../../fixtures/etherscan.fixtures";
import {
  etherscanERC1155EventToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanInternalTransactionToOperations,
  etherscanOperationToOperations,
} from "../../../../adapters";
import { getCoinConfig } from "../../../../config";

setupMockCryptoAssetsStore({
  getTokensSyncHash: async () => "0",
});

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

jest.mock("../../../../config");
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

    describe("getCoinOperations", () => {
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
          await ETHERSCAN_API.getCoinOperations(
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

        const response = await ETHERSCAN_API.getCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response).toEqual({
          operations: etherscanCoinOperations
            .map(op => etherscanOperationToOperations(account.id, op))
            .flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response).toEqual({
          operations: etherscanCoinOperations
            .map(op => etherscanOperationToOperations(account.id, op))
            .flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getCoinOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response).toEqual({
          operations: etherscanCoinOperations
            .map(op => etherscanOperationToOperations(account.id, op))
            .flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

    describe("getTokenOperations", () => {
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
          await ETHERSCAN_API.getTokenOperations(
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

        const response = await ETHERSCAN_API.getTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getTokenOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

    describe("getERC721Operations", () => {
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
          await ETHERSCAN_API.getERC721Operations(
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

        const response = await ETHERSCAN_API.getERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getERC721Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

    describe("getERC1155Operations", () => {
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
          await ETHERSCAN_API.getERC1155Operations(
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

        const response = await ETHERSCAN_API.getERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getERC1155Operations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response).toEqual({
          operations: [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

    describe("getNftOperations", () => {
      it("should return a sorted array of nft transactions", async () => {
        jest.spyOn(axios, "request").mockImplementation(async params => ({
          data: {
            result: params.url?.includes("tokennfttx")
              ? etherscanERC721Operations
              : etherscanERC1155Operations,
          },
        }));

        const response = await ETHERSCAN_API.getNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        // Verify operations are sorted by date descending
        const sortedOps = response.operations
          .slice()
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        expect(response).toEqual({
          operations: sortedOps,
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
      });
    });

    describe("getInternalOperations", () => {
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
          await ETHERSCAN_API.getInternalOperations(
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

        const response = await ETHERSCAN_API.getInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );

        expect(response).toEqual({
          operations: [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
        );

        expect(response).toEqual({
          operations: [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

        const response = await ETHERSCAN_API.getInternalOperations(
          currency,
          account.freshAddress,
          account.id,
          50,
          100,
        );

        expect(response).toEqual({
          operations: [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
          done: false,
          maxBlock: expect.any(Number),
          isPageFull: false,
        });
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

    describe("getNftOperations without nft", () => {
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
        const response = await ETHERSCAN_API.getNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
        );
        expect(response).toEqual({
          operations: [],
          done: true,
          maxBlock: 0,
          isPageFull: false,
        });
      });
    });

    describe("getOperations cascading effectiveMaxBlock logic", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      // Helpers to create mock Etherscan responses with specific block heights for each operation type
      const createMockCoinTxResponse = (blockNumbers: number[]) =>
        blockNumbers.map((blockNumber, i) => ({
          ...etherscanCoinOperations[0],
          blockNumber: String(blockNumber),
          hash: `0xcoin${blockNumber}${i}`,
        }));

      const createMockInternalTxResponse = (blockNumbers: number[]) =>
        blockNumbers.map((blockNumber, i) => ({
          ...etherscanInternalOperations[0],
          blockNumber: String(blockNumber),
          hash: `0xinternal${blockNumber}${i}`,
        }));

      const createMockTokenTxResponse = (blockNumbers: number[]) =>
        blockNumbers.map((blockNumber, i) => ({
          ...etherscanTokenOperations[0],
          blockNumber: String(blockNumber),
          hash: `0xtoken${blockNumber}${i}`,
        }));

      const createMockNftTxResponse = (blockNumbers: number[]) =>
        blockNumbers.map((blockNumber, i) => ({
          ...etherscanERC721Operations[0],
          blockNumber: String(blockNumber),
          hash: `0xnft${blockNumber}${i}`,
        }));

      // Helper to identify endpoint type from URL - order matters due to substring matching
      const getEndpointType = (url: string): string => {
        if (url.includes("action=txlistinternal")) return "internal";
        if (url.includes("action=txlist")) return "coin";
        if (url.includes("action=tokentx")) return "token";
        if (url.includes("action=tokennfttx")) return "erc721";
        if (url.includes("action=token1155tx")) return "erc1155";
        return "unknown";
      };

      it("should cascade effectiveMaxBlock from coin to internal when coin returns full page", async () => {
        const coinBlockHeight = 150;
        // Track calls per endpoint to return empty on page 2+ (to avoid infinite loop in exhaustEndpoint)
        const coinCallCount = { count: 0 };
        const spy = jest.spyOn(axios, "request").mockImplementation(async config => {
          const url = config.url as string;
          if (getEndpointType(url) === "coin") {
            coinCallCount.count++;
            // First call returns op, subsequent calls return empty (to break exhaustEndpoint loop)
            if (coinCallCount.count === 1) {
              return { data: { result: createMockCoinTxResponse([coinBlockHeight]) } };
            }
          }
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          undefined,
          1, // limit=1 to make single op a full page
        );

        const internalCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "internal",
        );
        expect(internalCall).toBeDefined();
        expect((internalCall![0] as any).params.endBlock).toBe(coinBlockHeight);
      });

      it("should cascade effectiveMaxBlock through all endpoints sequentially when pages are full", async () => {
        const coinMaxBlock = 180;
        const internalMaxBlock = 160;

        // Track calls per endpoint to return empty on page 2+ (to avoid infinite loop in exhaustEndpoint)
        const callCounts: Record<string, number> = {};
        const spy = jest.spyOn(axios, "request").mockImplementation(async config => {
          const url = config.url as string;
          const endpointType = getEndpointType(url);
          callCounts[endpointType] = (callCounts[endpointType] || 0) + 1;
          // First call returns op, subsequent calls return empty
          if (callCounts[endpointType] === 1) {
            if (endpointType === "coin") {
              return { data: { result: createMockCoinTxResponse([coinMaxBlock]) } };
            }
            if (endpointType === "internal") {
              return { data: { result: createMockInternalTxResponse([internalMaxBlock]) } };
            }
          }
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          undefined,
          1, // limit=1 to make single op a full page
        );

        const tokenCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "token",
        );
        expect(tokenCall).toBeDefined();
        expect((tokenCall![0] as any).params.endBlock).toBe(internalMaxBlock);
      });

      it("should cascade to min(callerToBlock, maxBlock) when page is full", async () => {
        const callerToBlock = 200;
        const coinMaxBlock = 150;

        // Track calls per endpoint to return empty on page 2+ (to avoid infinite loop in exhaustEndpoint)
        const coinCallCount = { count: 0 };
        const spy = jest.spyOn(axios, "request").mockImplementation(async config => {
          const url = config.url as string;
          if (getEndpointType(url) === "coin") {
            coinCallCount.count++;
            // First call returns op, subsequent calls return empty
            if (coinCallCount.count === 1) {
              return { data: { result: createMockCoinTxResponse([coinMaxBlock]) } };
            }
          }
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          callerToBlock,
          undefined,
          1, // limit=1 to make single op a full page
        );

        const coinCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "coin",
        );
        expect(coinCall).toBeDefined();
        expect((coinCall![0] as any).params.endBlock).toBe(callerToBlock);

        // After full page from coin, cascades to min(200, 150) = 150
        const internalCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "internal",
        );
        expect(internalCall).toBeDefined();
        expect((internalCall![0] as any).params.endBlock).toBe(coinMaxBlock);
      });

      it("should not cascade when all endpoints return empty", async () => {
        const callerToBlock = 200;

        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          callerToBlock,
          undefined,
          10,
        );

        const calls = spy.mock.calls;
        const coinCall = calls.find(call => getEndpointType((call[0] as any).url) === "coin");
        const internalCall = calls.find(
          call => getEndpointType((call[0] as any).url) === "internal",
        );
        const tokenCall = calls.find(call => getEndpointType((call[0] as any).url) === "token");

        expect((coinCall![0] as any).params.endBlock).toBe(callerToBlock);
        expect((internalCall![0] as any).params.endBlock).toBe(callerToBlock);
        expect((tokenCall![0] as any).params.endBlock).toBe(callerToBlock);
      });

      it("should pass limit to all endpoint calls", async () => {
        const limit = 25;

        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          undefined,
          limit,
        );

        const calls = spy.mock.calls;
        for (const call of calls) {
          expect((call[0] as any).params.offset).toBe(limit);
        }
      });

      it("should cascade minimum block height when multiple endpoints return full pages", async () => {
        const coinMaxBlock = 180;
        const internalMaxBlock = 200;
        const tokenMaxBlock = 150;

        // Track calls per endpoint to return empty on page 2+ (to avoid infinite loop in exhaustEndpoint)
        const callCounts: Record<string, number> = {};
        const spy = jest.spyOn(axios, "request").mockImplementation(async config => {
          const url = config.url as string;
          const endpointType = getEndpointType(url);
          callCounts[endpointType] = (callCounts[endpointType] || 0) + 1;
          // First call returns op, subsequent calls return empty
          if (callCounts[endpointType] === 1) {
            if (endpointType === "coin") {
              return { data: { result: createMockCoinTxResponse([coinMaxBlock]) } };
            }
            if (endpointType === "internal") {
              return { data: { result: createMockInternalTxResponse([internalMaxBlock]) } };
            }
            if (endpointType === "token") {
              return { data: { result: createMockTokenTxResponse([tokenMaxBlock]) } };
            }
          }
          return { data: { result: [] } };
        });

        await ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          undefined,
          1, // limit=1 to make single op a full page
        );

        // Internal call uses effectiveMaxBlock after coin = min(undefined, 180) = 180
        const internalCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "internal",
        );
        expect((internalCall![0] as any).params.endBlock).toBe(coinMaxBlock);

        // Token call uses effectiveMaxBlock after internal = min(180, 200) = 180
        // Note: internal returns 200 which is > 180, so no update, stays at 180
        const tokenCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "token",
        );
        expect((tokenCall![0] as any).params.endBlock).toBe(coinMaxBlock);

        // NFT call uses effectiveMaxBlock after token = min(180, 150) = 150
        const nftCall = spy.mock.calls.find(
          call => getEndpointType((call[0] as any).url) === "erc721",
        );
        expect(nftCall).toBeDefined();
        expect((nftCall![0] as any).params.endBlock).toBe(tokenMaxBlock);
      });
    });

    describe("exhaustEndpoint", () => {
      // Helper to create mock operations at specific block heights
      const createOps = (blockHeights: number[]): ETHERSCAN_API.EndpointResult["operations"] =>
        blockHeights.map((blockHeight, i) => ({
          id: `op-${blockHeight}-${i}`,
          hash: `0x${blockHeight}${i}`,
          accountId: account.id,
          blockHash: `0xblock${blockHeight}`,
          blockHeight,
          recipients: ["0x123"],
          senders: ["0x456"],
          value: new BigNumber(100),
          fee: new BigNumber(10),
          date: new Date(),
          type: "OUT" as const,
          extra: {},
        }));

      const createEndpointResult = (
        ops: ETHERSCAN_API.EndpointResult["operations"],
        isPageFull: boolean,
      ): ETHERSCAN_API.EndpointResult => ({
        operations: ops,
        done: ops.length === 0,
        maxBlock: ops.length > 0 ? Math.max(...ops.map(op => op.blockHeight ?? 0)) : 0,
        isPageFull,
      });

      it("page 1 not full => single call, returns only page 1 operations", async () => {
        const page1Ops = createOps([100, 99, 98]);
        const mockFetch = jest.fn<Promise<ETHERSCAN_API.EndpointResult>, [any, any, any, any, any, any, any, number?]>();
        mockFetch.mockResolvedValue(createEndpointResult(page1Ops, false));

        const result = await ETHERSCAN_API.exhaustEndpoint(
          mockFetch,
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          10,
          "desc",
        );

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          10,
          "desc",
          1,
        );
        expect(result).toEqual({
          operations: page1Ops,
          done: false,
          maxBlock: 100,
          isPageFull: false,
        });
      });

      it("page 1 full, page 2 not full with same block => returns all operations", async () => {
        const page1Ops = createOps([100, 100, 100]);
        const page2Ops = createOps([100, 100]);
        const mockFetch = jest.fn<Promise<ETHERSCAN_API.EndpointResult>, [any, any, any, any, any, any, any, number?]>();
        mockFetch
          .mockResolvedValueOnce(createEndpointResult(page1Ops, true))
          .mockResolvedValueOnce(createEndpointResult(page2Ops, false));

        const result = await ETHERSCAN_API.exhaustEndpoint(
          mockFetch,
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          3,
          "desc",
        );

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, currency, account.freshAddress, account.id, 0, undefined, 3, "desc", 1);
        expect(mockFetch).toHaveBeenNthCalledWith(2, currency, account.freshAddress, account.id, 0, undefined, 3, "desc", 2);
        expect(result.operations).toHaveLength(5);
        // isPageFull preserves firstPage.isPageFull for cascading effectiveMaxBlock
        expect(result.isPageFull).toBe(true);
      });

      it("page 1 full, page 2 has operations at different block => returns page 1 + boundary ops from page 2", async () => {
        const page1Ops = createOps([100, 100, 99]);
        const page2Ops = createOps([100, 98, 97]);
        const mockFetch = jest.fn<Promise<ETHERSCAN_API.EndpointResult>, [any, any, any, any, any, any, any, number?]>();
        mockFetch
          .mockResolvedValueOnce(createEndpointResult(page1Ops, true))
          .mockResolvedValueOnce(createEndpointResult(page2Ops, false));

        const result = await ETHERSCAN_API.exhaustEndpoint(
          mockFetch,
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          3,
          "desc",
        );

        expect(mockFetch).toHaveBeenCalledTimes(2);
        // Should include page1 (3 ops) + only boundary block ops from page2 (1 op at block 100)
        expect(result.operations).toHaveLength(4);
        expect(result.operations.every(op => op.blockHeight === 100 || op.blockHeight === 99)).toBe(true);
        expect(result.done).toBe(false);
        // isPageFull preserves firstPage.isPageFull for cascading effectiveMaxBlock
        expect(result.isPageFull).toBe(true);
      });

      it("page 1 full, page 2 empty => returns page 1 operations", async () => {
        const page1Ops = createOps([100, 100, 100]);
        const mockFetch = jest.fn<Promise<ETHERSCAN_API.EndpointResult>, [any, any, any, any, any, any, any, number?]>();
        mockFetch
          .mockResolvedValueOnce(createEndpointResult(page1Ops, true))
          .mockResolvedValueOnce(createEndpointResult([], false));

        const result = await ETHERSCAN_API.exhaustEndpoint(
          mockFetch,
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          3,
          "desc",
        );

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.operations).toHaveLength(3);
        expect(result.done).toBe(true);
      });

      it("multiple full pages at same block, then partial => exhausts all", async () => {
        const page1Ops = createOps([100, 100, 100]);
        const page2Ops = createOps([100, 100, 100]);
        const page3Ops = createOps([100]);
        const mockFetch = jest.fn<Promise<ETHERSCAN_API.EndpointResult>, [any, any, any, any, any, any, any, number?]>();
        mockFetch
          .mockResolvedValueOnce(createEndpointResult(page1Ops, true))
          .mockResolvedValueOnce(createEndpointResult(page2Ops, true))
          .mockResolvedValueOnce(createEndpointResult(page3Ops, false));

        const result = await ETHERSCAN_API.exhaustEndpoint(
          mockFetch,
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          3,
          "desc",
        );

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockFetch).toHaveBeenNthCalledWith(3, currency, account.freshAddress, account.id, 0, undefined, 3, "desc", 3);
        expect(result.operations).toHaveLength(7);
        // isPageFull preserves firstPage.isPageFull for cascading effectiveMaxBlock
        expect(result.isPageFull).toBe(true);
      });
    });
  });
});

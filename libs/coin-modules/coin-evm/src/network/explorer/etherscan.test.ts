import { AssertionError, fail } from "assert";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios from "axios";
import BigNumber from "bignumber.js";
import {
  deserializePagingToken,
  etherscanERC1155EventToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanInternalTransactionToOperations,
  etherscanOperationToOperations,
  PagingState,
  serializePagingToken,
} from "../../adapters";
import { getCoinConfig } from "../../config";
import { EtherscanLikeExplorerUsedIncorrectly } from "../../errors";
import { makeAccount } from "../../fixtures/common.fixtures";
import {
  etherscanCoinOperations,
  etherscanERC1155Operations,
  etherscanERC721Operations,
  etherscanInternalOperations,
  etherscanTokenOperations,
} from "../../fixtures/etherscan.fixtures";
import * as ETHERSCAN_API from "./etherscan";

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

// Factory to create fetch utilities for isPageFull/isDone tests
const createFetchWithLimit =
  <T>(
    apiFn: (params: ETHERSCAN_API.FetchOperationsParams) => Promise<ETHERSCAN_API.EndpointResult>,
  ) =>
  async (ops: T[], limit: number | undefined, sort: "asc" | "desc" = "desc") => {
    jest.spyOn(axios, "request").mockResolvedValueOnce({
      data: { result: ops },
    });
    return apiFn({
      currency,
      address: account.freshAddress,
      accountId: account.id,
      fromBlock: 0,
      limit,
      sort,
    });
  };

// Helper to extract pagination state for assertions
const paginationState = (result: ETHERSCAN_API.EndpointResult) => ({
  isPageFull: result.isPageFull,
  isDone: result.isDone,
  nbOps: result.operations.length,
});

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
        await ETHERSCAN_API.getCoinOperations({
          currency: {
            ...currency,
            ethereumLikeInfo: {
              chainId: 1,
            },
          },
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
        });
        fail("Promise should have been rejected");
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        expect(e).toBeInstanceOf(EtherscanLikeExplorerUsedIncorrectly);
      }
    });

    it("should return a flat list of coin transactions from block 0 for an unlimited page", async () => {
      const spy = jest.spyOn(axios, "request").mockImplementation(async () => ({
        data: {
          result: etherscanCoinOperations,
        },
      }));

      const response = await ETHERSCAN_API.getCoinOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        isDone: true,
        boundBlock: 14923692,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getCoinOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        isDone: true,
        boundBlock: 14923692,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getCoinOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
        toBlock: 100,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        isDone: true,
        boundBlock: 14923692,
        isPageFull: true,
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

    describe("isPageFull and isDone", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getCoinOperations);

      // etherscanCoinOperations: 3 raw ops => 4 processed ops (one self-send creates 2 ops)
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined (= unlimited page) with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit(etherscanCoinOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined (= unlimited page) without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
    });

    describe("sort parameter", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getCoinOperations);

      it("should pass sort parameter to API and return operations in received order (trusting endpoint)", async () => {
        const resultAsc = await fetchWithLimit(etherscanCoinOperations, undefined, "asc");
        const resultDesc = await fetchWithLimit(etherscanCoinOperations, undefined, "desc");
        // the order must be respected by the underlying api, it's not enforced by implementation
        expect(resultAsc.operations).toEqual(resultDesc.operations);
        // boundBlock is always the last element of the operations array (boundary for pagination)
        expect(resultAsc.boundBlock).toEqual(resultDesc.boundBlock);
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
        await ETHERSCAN_API.getTokenOperations({
          currency: {
            ...currency,
            ethereumLikeInfo: {
              chainId: 1,
            },
          },
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
        });
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

      const response = await ETHERSCAN_API.getTokenOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4764973,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getTokenOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4764973,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getTokenOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
        toBlock: 100,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4764973,
        isPageFull: true,
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

    describe("isPageFull and isDone", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getTokenOperations);

      // etherscanTokenOperations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit(etherscanTokenOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
    });

    describe("sort parameter", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getTokenOperations);

      it("should pass sort parameter to API and return operations in received order (trusting endpoint)", async () => {
        const resultAsc = await fetchWithLimit(etherscanTokenOperations, undefined, "asc");
        const resultDesc = await fetchWithLimit(etherscanTokenOperations, undefined, "desc");
        // the order must be respected by the underlying api, it's not enforced by implementation
        expect(resultAsc.operations).toEqual(resultDesc.operations);
        // boundBlock is always the last element of the operations array (boundary for pagination)
        expect(resultAsc.boundBlock).toEqual(resultDesc.boundBlock);
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
        await ETHERSCAN_API.getERC721Operations({
          currency: {
            ...currency,
            ethereumLikeInfo: {
              chainId: 1,
            },
          },
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
        });
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

      const response = await ETHERSCAN_API.getERC721Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4708161,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getERC721Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4708161,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getERC721Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
        toBlock: 100,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 4708161,
        isPageFull: true,
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

    describe("isPageFull and isDone", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC721Operations);

      // etherscanERC721Operations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit(etherscanERC721Operations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
    });

    describe("sort parameter", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC721Operations);

      it("should pass sort parameter to API and return operations in received order (trusting endpoint)", async () => {
        const resultAsc = await fetchWithLimit(etherscanERC721Operations, undefined, "asc");
        const resultDesc = await fetchWithLimit(etherscanERC721Operations, undefined, "desc");
        // the order must be respected by the underlying api, it's not enforced by implementation
        expect(resultAsc.operations).toEqual(resultDesc.operations);
        // boundBlock is always the last element of the operations array (boundary for pagination)
        expect(resultAsc.boundBlock).toEqual(resultDesc.boundBlock);
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
        await ETHERSCAN_API.getERC1155Operations({
          currency: {
            ...currency,
            ethereumLikeInfo: {
              chainId: 1,
            },
          },
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
        });
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

      const response = await ETHERSCAN_API.getERC1155Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 14049909,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getERC1155Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 14049909,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getERC1155Operations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
        toBlock: 100,
      });

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        isDone: true,
        boundBlock: 14049909,
        isPageFull: true,
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

    describe("isPageFull and isDone", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC1155Operations);

      // etherscanERC1155Operations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit(etherscanERC1155Operations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
    });

    describe("sort parameter", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC1155Operations);

      it("should pass sort parameter to API and return operations in received order (trusting endpoint)", async () => {
        const resultAsc = await fetchWithLimit(etherscanERC1155Operations, undefined, "asc");
        const resultDesc = await fetchWithLimit(etherscanERC1155Operations, undefined, "desc");
        // the order must be respected by the underlying api, it's not enforced by implementation
        expect(resultAsc.operations).toEqual(resultDesc.operations);
        // boundBlock is always the last element of the operations array (boundary for pagination)
        expect(resultAsc.boundBlock).toEqual(resultDesc.boundBlock);
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

      const response = await ETHERSCAN_API.getNftOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      // Verify operations are sorted by date descending
      const sortedOps = response.operations
        .slice()
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      expect(response.operations.length).toBe(8);
      expect(response).toEqual({
        operations: sortedOps,
        isDone: true,
        boundBlock: 14049909,
        isPageFull: true,
      });
    });

    describe("isPageFull and isDone", () => {
      const fetchNftOperationsWithLimit = async (
        erc721Ops: typeof etherscanERC721Operations,
        erc1155Ops: typeof etherscanERC1155Operations,
        limit: number | undefined,
        sort: "asc" | "desc" = "desc",
      ) => {
        jest.spyOn(axios, "request").mockImplementation(async params => ({
          data: {
            result: params.url?.includes("tokennfttx") ? erc721Ops : erc1155Ops,
          },
        }));
        return ETHERSCAN_API.getNftOperations({
          currency,
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
          limit,
          sort,
        });
      };

      // etherscanERC721Operations (3) + etherscanERC1155Operations (3) => 8 processed ops
      const expectedProcessedOpsCount = 8;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          etherscanERC721Operations.length + etherscanERC1155Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          etherscanERC721Operations.length, // limit matches one of the endpoints
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          undefined,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchNftOperationsWithLimit([], [], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
    });

    describe("sort parameter", () => {
      const fetchNftOperationsWithSort = async (sort: "asc" | "desc") => {
        jest.spyOn(axios, "request").mockImplementation(async params => ({
          data: {
            result: params.url?.includes("tokennfttx")
              ? etherscanERC721Operations
              : etherscanERC1155Operations,
          },
        }));
        return ETHERSCAN_API.getNftOperations({
          currency,
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
          sort,
        });
      };

      it("should pass sort parameter to both underlying API calls and sort combined results", async () => {
        const resultAsc = await fetchNftOperationsWithSort("asc");
        const resultDesc = await fetchNftOperationsWithSort("desc");

        // getNftOperations sorts the combined ERC721+ERC1155 results internally
        expect(resultAsc.operations).not.toEqual(resultDesc.operations);
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
        await ETHERSCAN_API.getInternalOperations({
          currency: {
            ...currency,
            ethereumLikeInfo: {
              chainId: 1,
            },
          },
          address: account.freshAddress,
          accountId: account.id,
          fromBlock: 0,
        });
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

      const response = await ETHERSCAN_API.getInternalOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        isDone: true,
        boundBlock: 15214745,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getInternalOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
      });

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        isDone: true,
        boundBlock: 15214745,
        isPageFull: true,
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

      const response = await ETHERSCAN_API.getInternalOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 50,
        toBlock: 100,
      });

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        isDone: true,
        boundBlock: 15214745,
        isPageFull: true,
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

    describe("isPageFull and isDone", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getInternalOperations);

      // etherscanInternalOperations: 4 raw ops => 3 processed ops (self-send excluded)
      const expectedProcessedOpsCount = 3;

      it("limit > nb ops => isPageFull = false, isDone = true", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, isDone = false", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit(etherscanInternalOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, isDone = true", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          isDone: true,
          nbOps: 0,
        });
      });
      it("should pass sort parameter to API and return operations in received order (trusting endpoint)", async () => {
        const resultAsc = await fetchWithLimit(etherscanInternalOperations, undefined, "asc");
        const resultDesc = await fetchWithLimit(etherscanInternalOperations, undefined, "desc");
        // the order must be respected by the underlying api, it's not enforced by implementation
        expect(resultAsc.operations).toEqual(resultDesc.operations);
        // boundBlock is always the last element of the operations array (boundary for pagination)
        expect(resultAsc.boundBlock).toEqual(resultDesc.boundBlock);
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

    it("should not return NFT operation", async () => {
      const response = await ETHERSCAN_API.getNftOperations({
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
      });
      expect(response).toEqual({
        operations: [],
        isDone: true,
        boundBlock: 0,
        isPageFull: false,
      });
    });
  });

  describe("getOperations cascades calls optimising the block range", () => {
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

    // Helper to identify endpoint type from URL - order matters due to substring matching
    const getEndpointType = (url: string): string => {
      if (url.includes("action=txlistinternal")) return "internal";
      if (url.includes("action=txlist")) return "coin";
      if (url.includes("action=tokentx")) return "token";
      if (url.includes("action=tokennfttx")) return "erc721";
      if (url.includes("action=token1155tx")) return "erc1155";
      return "unknown";
    };

    // Type for blockchain operation representation in test scenarios
    type BlockchainOp = { type: "C" | "I" | "T"; block: number; toString: () => string };

    // Factory to create operation constants
    const makeOp = (type: "C" | "I" | "T", block: number): BlockchainOp => ({
      type,
      block,
      toString: () => `${type}${block}`,
    });

    // Operation constants for clean test syntax: C0, C1, ..., I0, I1, ..., T0, T1, ...
    const [C0, C1, C2, C3, C4, C5, C6, C7, C8, C9] = Array.from({ length: 10 }, (_, i) =>
      makeOp("C", i),
    );
    const [_I0, I1, I2, I3, I4, I5, I6, I7, I8, I9] = Array.from({ length: 10 }, (_, i) =>
      makeOp("I", i),
    );
    const [_T0, T1, T2, T3, T4, T5, T6, T7, T8, T9] = Array.from({ length: 10 }, (_, i) =>
      makeOp("T", i),
    );

    // Helper to convert ops to string array for assertions: ops(I6, I6, I6) => ["I6", "I6", "I6"]
    const ops = (...items: BlockchainOp[]) => items.map(String);

    // Create intelligent mock that simulates blockchain based on given operations
    const createBlockchainMock = (allOps: BlockchainOp[], limit: number, order: "asc" | "desc") => {
      const pageCounts: Record<string, number> = {};

      return async (config: any) => {
        const url = config.url as string;
        const params = config.params;
        const startBlock = params.startBlock ?? 0;
        const endBlock = params.endBlock ?? Infinity;
        const pageLimit = params.offset ?? limit;
        const endpointType = getEndpointType(url);

        // Track page counts per endpoint to handle exhaustEndpoint pagination
        const key = `${endpointType}-${startBlock}-${endBlock}`;
        pageCounts[key] = (pageCounts[key] || 0) + 1;
        const currentPage = pageCounts[key];

        // Filter ops by type and range
        const typeMap: Record<string, "C" | "I" | "T"> = {
          coin: "C",
          internal: "I",
          token: "T",
        };
        const opType = typeMap[endpointType];
        if (!opType) return { data: { result: [] } };

        const filteredOps = allOps
          .filter(op => op.type === opType && op.block >= startBlock && op.block <= endBlock)
          .sort((a, b) => (order === "desc" ? b.block - a.block : a.block - b.block));

        // Simulate pagination: skip (page-1)*limit, take limit
        const startIdx = (currentPage - 1) * pageLimit;
        const pageOps = filteredOps.slice(startIdx, startIdx + pageLimit);

        // Convert to Etherscan response format
        if (opType === "C") {
          return { data: { result: createMockCoinTxResponse(pageOps.map(op => op.block)) } };
        } else if (opType === "I") {
          return { data: { result: createMockInternalTxResponse(pageOps.map(op => op.block)) } };
        } else {
          return { data: { result: createMockTokenTxResponse(pageOps.map(op => op.block)) } };
        }
      };
    };

    // Helper to call getOperations with common parameters
    const callGetOperations =
      (order: "asc" | "desc") =>
      (
        allOps: BlockchainOp[],
        opts: {
          fromBlock?: number;
          toBlock?: number;
          pagingState?: PagingState;
          limit?: number;
        } = {},
      ) => {
        const { fromBlock = 0, toBlock, pagingState, limit = 3 } = opts;
        const pagingToken = pagingState
          ? serializePagingToken(pagingState.boundBlock, pagingState)
          : undefined;
        jest.spyOn(axios, "request").mockImplementation(createBlockchainMock(allOps, limit, order));
        return ETHERSCAN_API.getOperations.force(
          currency,
          account.freshAddress,
          account.id,
          fromBlock,
          toBlock,
          pagingToken,
          limit,
          order,
        );
      };

    // Helper to extract result summary for assertions
    const summarize = (result: {
      lastCoinOperations: { blockHeight?: number }[];
      lastTokenOperations: { blockHeight?: number }[];
      lastInternalOperations: { blockHeight?: number }[];
      nextPagingToken?: string;
    }): { ops: string[]; pagingState: PagingState | undefined } => {
      const tagged = [
        ...result.lastCoinOperations.map(op => ({ type: "C", block: op.blockHeight })),
        ...result.lastInternalOperations.map(op => ({ type: "I", block: op.blockHeight })),
        ...result.lastTokenOperations.map(op => ({ type: "T", block: op.blockHeight })),
      ];
      // Secondary sort order: C < I < T (coin first at same block)
      const typeOrder = { C: 0, I: 1, T: 2 } as Record<string, number>;
      const ops = tagged
        .filter((op): op is { type: string; block: number } => op.block !== undefined)
        .sort((a, b) => b.block - a.block || typeOrder[a.type] - typeOrder[b.type])
        .map(op => `${op.type}${op.block}`);
      const pagingState = deserializePagingToken(result.nextPagingToken);
      return { ops, pagingState };
    };

    // Helper to create expected paging state (nft is always true/done in tests)
    const paging = (
      boundBlock: number,
      flags: { coin: boolean; internal: boolean; token: boolean },
    ): PagingState => ({
      boundBlock,
      coinIsDone: flags.coin,
      internalIsDone: flags.internal,
      tokenIsDone: flags.token,
      nftIsDone: true,
    });

    describe("desc mode", () => {
      describe("drop scenarios - operations discarded due to cascading boundBlock", () => {
        it("drops full coin result when internal has higher blocks", async () => {
          const result = await callGetOperations("desc")([I6, I6, I6, I5, T5, C4, C3, C2]);
          // - coin([Ø, Ø])       [C4 C3 C2]     boundBlock=2, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([2, Ø])   [I6 I6 I6]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page, higher boundBlock)
          // - token([6, Ø])      []             boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded, T5 excluded)
          // Result: only I6s kept, coin ops dropped (below boundBlock=6)
          expect(summarize(result)).toEqual({
            ops: ops(I6, I6, I6),
            pagingState: paging(5, { coin: false, internal: false, token: true }),
          });
        });

        it("drops full coin result, keeps token ops above boundBlock", async () => {
          const result = await callGetOperations("desc")([T7, I6, I6, I6, T5, C4, C3, C2, I2]);
          // - coin([Ø, Ø])       [C4 C3 C2]     boundBlock=2, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([2, Ø])   [I6 I6 I6]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page, higher boundBlock)
          // - token([6, Ø])      [T7]           boundBlock=Ø, isPageFull=false, hasMorePage=false (T7 >= 6)
          // Result: T7 + I6s kept, coin ops dropped (below boundBlock=6)
          expect(summarize(result)).toEqual({
            ops: ops(T7, I6, I6, I6),
            pagingState: paging(5, { coin: false, internal: false, token: true }),
          });
        });

        it("drops full coin and internal results when token has highest blocks", async () => {
          const result = await callGetOperations("desc")([
            T9,
            T8,
            T7,
            I6,
            I5,
            I4,
            C3,
            C2,
            C1,
            I1,
            T1,
          ]);
          // - coin([Ø, Ø])       [C3 C2 C1]     boundBlock=1, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([1, Ø])   [I6 I5 I4]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page)
          // - token([4, Ø])      [T9 T8 T7]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page, highest boundBlock)
          // Result: only T9/T8/T7 kept, coin+internal ops dropped (below boundBlock=7)
          expect(summarize(result)).toEqual({
            ops: ops(T9, T8, T7),
            pagingState: paging(6, { coin: false, internal: false, token: true }),
          });
        });

        it("drops partial results from coin and internal", async () => {
          const result = await callGetOperations("desc")([
            T9,
            T8,
            I8,
            T7,
            I7,
            C7,
            I6,
            C6,
            T6,
            C5,
            T1,
            I1,
          ]);
          // - coin([Ø, Ø])       [C7 C6 C5]     boundBlock=5, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([5, Ø])   [I8 I7 I6]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page, higher boundBlock)
          // - token([6, Ø])      [T9 T8 T7]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page, highest boundBlock)
          // Result: ops >= 7 kept, lower ops dropped (below boundBlock=7)
          expect(summarize(result)).toEqual({
            ops: ops(T9, I8, T8, C7, I7, T7),
            pagingState: paging(6, { coin: false, internal: false, token: false }),
          });
        });
      });

      describe("no-drop scenarios - all operations kept", () => {
        it("keeps all when subsequent pages are not full", async () => {
          const result = await callGetOperations("desc")([I6, I6, T5, C4, C3, C2, C1, T1]);
          // - coin([Ø, Ø])       [C4 C3 C2]     boundBlock=1, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([1, Ø])   [I6 I6]        boundBlock=1, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // - token([1, Ø])      [T5]           boundBlock=1, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // Result: all ops kept, boundBlock stays at 1 because subsequent pages not full
          expect(summarize(result)).toEqual({
            ops: ops(I6, I6, T5, C4, C3, C2),
            pagingState: paging(1, { coin: false, internal: true, token: true }),
          });
        });

        it("keeps all when no endpoint has full page", async () => {
          const result = await callGetOperations("desc")([I6, T5, C4]);
          // - coin([Ø, Ø])       [C4]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // - internal([Ø, Ø])   [I6]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // - token([Ø, Ø])      [T5]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // Result: all ops kept, no pagination token (all data fetched)
          expect(summarize(result)).toEqual({ ops: ops(I6, T5, C4), pagingState: undefined });
        });

        it("keeps all when only coin has ops", async () => {
          const result = await callGetOperations("desc")([C4, C3, C2, C1]);
          // - coin([Ø, Ø])       [C4 C3 C2]     boundBlock=1, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([1, Ø])   []             boundBlock=1, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // - token([1, Ø])      []             boundBlock=1, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // Result: coin ops kept, nextPagingToken=1 for remaining C1
          expect(summarize(result)).toEqual({
            ops: ops(C4, C3, C2),
            pagingState: paging(1, { coin: false, internal: true, token: true }),
          });
        });

        it("keeps all when only token has ops", async () => {
          const result = await callGetOperations("desc")([T4, T3, T2, T1]);
          // - coin([Ø, Ø])       []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - internal([Ø, Ø])   []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - token([Ø, Ø])      [T4 T3 T2]     boundBlock=1, isPageFull=true,  hasMorePage=true  (full page)
          // Result: token ops kept, nextPagingToken=1 for remaining T1
          expect(summarize(result)).toEqual({
            ops: ops(T4, T3, T2),
            pagingState: paging(1, { coin: true, internal: true, token: false }),
          });
        });

        it("cascades without dropping when blocks interleave nicely", async () => {
          const result = await callGetOperations("desc")([T6, C5, I5, C4, I4, C3, I2, I1, C1, T1]);
          // - coin([Ø, Ø])       [C5 C4 C3]     boundBlock=3, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([3, Ø])   [I5 I4]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - token([3, Ø])      [T6]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // Result: all ops >= 3 kept, interleaved blocks don't cause drops
          expect(summarize(result)).toEqual({
            ops: ops(T6, C5, I5, C4, I4, C3),
            pagingState: paging(2, { coin: false, internal: true, token: true }),
          });
        });

        it("uses boundBlock from internal when coin page is not full", async () => {
          const result = await callGetOperations("desc")([T6, I6, C5, C4, I4, I3, I2, I1, T1]);
          // - coin([Ø, Ø])       [C5 C4]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([Ø, Ø])   [I6 I4 I3]     boundBlock=3, isPageFull=true,  hasMorePage=true  (full page)
          // - token([3, Ø])      [T6]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // Result: all ops >= 3 kept, boundBlock from internal applies
          expect(summarize(result)).toEqual({
            ops: ops(I6, T6, C5, C4, I4, I3),
            pagingState: paging(2, { coin: true, internal: false, token: true }),
          });
        });

        it("handles empty token result with boundBlock from internal", async () => {
          const result = await callGetOperations("desc")([I6, C5, C4, I4, I3, I2, I1, T1]);
          // - coin([Ø, Ø])       [C5 C4]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([Ø, Ø])   [I6 I4 I3]     boundBlock=3, isPageFull=true,  hasMorePage=true  (full page)
          // - token([3, Ø])      []             boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded, T1 excluded)
          // Result: coin + internal ops kept
          expect(summarize(result)).toEqual({
            ops: ops(I6, C5, C4, I4, I3),
            pagingState: paging(2, { coin: true, internal: false, token: true }),
          });
        });

        it("handles all endpoints with full pages at same block", async () => {
          const result = await callGetOperations("desc")([
            C4,
            C4,
            C4,
            I4,
            I4,
            I4,
            T4,
            T4,
            T4,
            C1,
            T1,
            I1,
          ]);
          // - coin([Ø, Ø])       [C4 C4 C4]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([4, Ø])   [I4 I4 I4]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page, same boundBlock)
          // - token([4, Ø])      [T4 T4 T4]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page, same boundBlock)
          // Result: all 9 ops at block 4 kept, all at boundBlock=4
          expect(summarize(result)).toEqual({
            ops: ops(C4, C4, C4, I4, I4, I4, T4, T4, T4),
            pagingState: paging(3, { coin: false, internal: true, token: true }),
          });
        });

        it("returns empty when all endpoints return empty", async () => {
          const result = await callGetOperations("desc")([]);
          // - coin([Ø, Ø])       []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - internal([Ø, Ø])   []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - token([Ø, Ø])      []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // Result: empty, no pagination needed
          expect(summarize(result)).toEqual({ ops: [], pagingState: undefined });
        });
      });

      describe("with pagination token", () => {
        it("skips coin endpoint when it is done", async () => {
          const result = await callGetOperations("desc")([C1], {
            pagingState: paging(5, { coin: true, internal: false, token: false }),
          });
          expect(summarize(result)).toEqual({
            ops: ops(),
            pagingState: undefined,
          });
        });

        it("skips internal endpoint when it is done", async () => {
          const result = await callGetOperations("desc")([I1], {
            pagingState: paging(5, { coin: false, internal: true, token: false }),
          });
          expect(summarize(result)).toEqual({
            ops: ops(),
            pagingState: undefined,
          });
        });

        it("skips token endpoint when it is done", async () => {
          const result = await callGetOperations("desc")([T1], {
            pagingState: paging(5, { coin: false, internal: false, token: true }),
          });
          expect(summarize(result)).toEqual({
            ops: ops(),
            pagingState: undefined,
          });
        });

        it("uses token as toBlock for all calls", async () => {
          const result = await callGetOperations("desc")(
            [T6, I6, C6, C5, I5, C4, I4, C3, I2, I1, C1, T1],
            {
              pagingState: paging(5, { coin: false, internal: false, token: false }),
            },
          );
          // pagingState.boundBlock=5 acts as toBlock for all endpoints
          // - coin([Ø, 5])       [C5 C4 C3]     boundBlock=3, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([3, 5])   [I5 I4]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - token([3, 5])      []             boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded)
          // Result: C5/C4/C3 + I5/I4 kept, T6/I6/C6 excluded by pagingToken
          expect(summarize(result)).toEqual({
            ops: ops(C5, I5, C4, I4, C3),
            pagingState: paging(2, { coin: false, internal: true, token: true }),
          });
        });
      });

      describe("with fromBlock and toBlock", () => {
        it("uses fromBlock and cascades boundBlock when page is full", async () => {
          const result = await callGetOperations("desc")(
            [T7, I7, C7, C5, I5, C4, I4, C3, C2, I2, I1, C1, T1],
            {
              fromBlock: 2,
              toBlock: 6,
            },
          );
          // fromBlock=2, toBlock=6 restricts all endpoints
          // - coin([2, 6])       [C5 C4 C3]     boundBlock=3, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([3, 6])   [I5 I4]        boundBlock=3, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // - token([3, 6])      []             boundBlock=3, isPageFull=false, hasMorePage=true  (bounded by boundBlock > fromBlock)
          // Result: ops in [3, 6] kept, T7/I7/C7 excluded by toBlock
          expect(summarize(result)).toEqual({
            ops: ops(C5, I5, C4, I4, C3),
            pagingState: paging(2, { coin: false, internal: true, token: true }),
          });
        });

        it("reaches fromBlock and returns no pagination token", async () => {
          const result = await callGetOperations("desc")(
            [C7, T6, C6, C5, I5, I4, I2, I1, C1, T1, C0],
            {
              fromBlock: 2,
              toBlock: 6,
            },
          );
          // fromBlock=2, toBlock=6, lowest ops reach fromBlock
          // - coin([2, 6])       [C6 C5]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([Ø, 6])   [I5 I4 I2]     boundBlock=Ø, isPageFull=true,  hasMorePage=false (full but reached fromBlock)
          // - token([Ø, 6])      [T6]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // Result: all ops in [2, 6] kept, no nextPagingToken (reached fromBlock)
          expect(summarize(result)).toEqual({
            ops: ops(C6, T6, C5, I5, I4, I2),
            pagingState: undefined,
          });
        });
      });
    });

    describe("asc mode", () => {
      describe("drop scenarios - operations discarded due to cascading boundBlock", () => {
        it("drops full coin result when internal has lower blocks", async () => {
          // I4 added to ensure internal has more ops (hasMorePage=true after boundBlock=3)
          const result = await callGetOperations("asc")([C5, C6, C7, C8, T4, I2, I2, I3, I4]);
          // - coin([Ø, Ø])       [C5 C6 C7]+[C8] boundBlock=7, isPageFull=true,  hasMorePage=true  (full page + more)
          // - internal([Ø, 7])   [I2 I2 I3]+[I4] boundBlock=3, isPageFull=true,  hasMorePage=true  (full page + more, lower boundBlock)
          // - token([Ø, 3])      []              boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded)
          // Result: only I2s and I3 kept, coin ops dropped (above boundBlock=3)
          expect(summarize(result)).toEqual({
            ops: ops(I3, I2, I2),
            pagingState: paging(4, { coin: false, internal: false, token: true }),
          });
        });

        it("drops full coin result, keeps token ops below boundBlock", async () => {
          // I4 and C8 added to ensure full pages with hasMorePage=true
          const result = await callGetOperations("asc")([T1, I2, I2, I3, I4, T4, C5, C6, C7, C8]);
          // - coin([Ø, Ø])       [C5 C6 C7]+[C8] boundBlock=7, isPageFull=true,  hasMorePage=true  (full page + more)
          // - internal([Ø, 7])   [I2 I2 I3]+[I4] boundBlock=3, isPageFull=true,  hasMorePage=true  (full page + more, lower boundBlock)
          // - token([Ø, 3])      [T1]            boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded)
          // Result: T1 + I2s + I3 kept, coin ops dropped (above boundBlock=3)
          expect(summarize(result)).toEqual({
            ops: ops(I3, I2, I2, T1),
            pagingState: paging(4, { coin: false, internal: false, token: true }),
          });
        });

        it("drops full coin and internal results when token has lowest blocks", async () => {
          const result = await callGetOperations("asc")([
            T1,
            T2,
            T3,
            I4,
            I5,
            I6,
            C7,
            C8,
            C9,
            I9,
            T9,
          ]);
          // - coin([Ø, Ø])       [C7 C8 C9]     boundBlock=Ø, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, Ø])   [I4 I5 I6]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page)
          // - token([Ø, 7])      [T1 T2 T3]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page, lowest boundBlock)
          // Result: only T1/T2/T3 kept, coin+internal ops dropped (above boundBlock=4)
          expect(summarize(result)).toEqual({
            ops: ops(T3, T2, T1),
            pagingState: paging(4, { coin: false, internal: false, token: true }),
          });
        });

        it("drops partial results from coin and internal", async () => {
          const result = await callGetOperations("asc")([
            T1,
            T2,
            I2,
            T3,
            I3,
            C3,
            I4,
            C4,
            T4,
            C5,
            T9,
            I9,
          ]);
          // - coin([Ø, Ø])       [C3 C4 C5]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, 6])   [I2 I3 I4]     boundBlock=5, isPageFull=true,  hasMorePage=true  (full page, lower boundBlock)
          // - token([Ø, 5])      [T1 T2 T3]     boundBlock=4, isPageFull=true,  hasMorePage=true  (full page, lowest boundBlock)
          // Result: ops <= 3 kept, higher ops dropped (above boundBlock=4)
          expect(summarize(result)).toEqual({
            ops: ops(C3, I3, T3, I2, T2, T1),
            pagingState: paging(4, { coin: false, internal: false, token: false }),
          });
        });
      });

      describe("no-drop scenarios - all operations kept", () => {
        it("keeps all when subsequent pages are not full", async () => {
          const result = await callGetOperations("asc")([I2, I2, T4, C5, C6, C7, C8, T8]);
          // - coin([Ø, Ø])       [C5 C6 C7]     boundBlock=8, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, 8])   [I2 I2]        boundBlock=8, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // - token([Ø, 8])      [T4]           boundBlock=8, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: all ops kept, boundBlock stays at 8 because subsequent pages not full
          expect(summarize(result)).toEqual({
            ops: ops(C7, C6, C5, T4, I2, I2),
            pagingState: paging(8, { coin: false, internal: true, token: true }),
          });
        });

        it("keeps all when no endpoint has full page", async () => {
          const result = await callGetOperations("asc")([I2, T4, C5]);
          // - coin([Ø, Ø])       [C5]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // - internal([Ø, Ø])   [I2]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // - token([Ø, Ø])      [T4]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full, no more data)
          // Result: all ops kept, no pagination token (all data fetched)
          expect(summarize(result)).toEqual({ ops: ops(C5, T4, I2), pagingState: undefined });
        });

        it("keeps all when only coin has ops", async () => {
          const result = await callGetOperations("asc")([C5, C6, C7, C8]);
          // - coin([Ø, Ø])       [C5 C6 C7]     boundBlock=8, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, 8])   []             boundBlock=8, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // - token([Ø, 8])      []             boundBlock=8, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: coin ops kept, nextPagingToken=8 for remaining C8
          expect(summarize(result)).toEqual({
            ops: ops(C7, C6, C5),
            pagingState: paging(8, { coin: false, internal: true, token: true }),
          });
        });

        it("keeps all when only token has ops", async () => {
          const result = await callGetOperations("asc")([T5, T6, T7, T8]);
          // - coin([Ø, Ø])       []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - internal([Ø, Ø])   []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - token([Ø, Ø])      [T5 T6 T7]     boundBlock=8, isPageFull=true,  hasMorePage=true  (full page)
          // Result: token ops kept, nextPagingToken=8 for remaining T8
          expect(summarize(result)).toEqual({
            ops: ops(T7, T6, T5),
            pagingState: paging(8, { coin: true, internal: true, token: false }),
          });
        });

        it("cascades without dropping when blocks interleave nicely", async () => {
          const result = await callGetOperations("asc")([T2, C4, I4, C5, I5, C6, I7, I8, C8, T8]);
          // - coin([Ø, Ø])       [C4 C5 C6]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, 7])   [I4 I5]        boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // - token([Ø, 7])      [T2]           boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: all ops <= 6 kept, interleaved blocks don't cause drops
          expect(summarize(result)).toEqual({
            ops: ops(C6, C5, I5, C4, I4, T2),
            pagingState: paging(7, { coin: false, internal: true, token: true }),
          });
        });

        it("uses boundBlock from internal when coin page is not full", async () => {
          const result = await callGetOperations("asc")([T2, I2, C4, C5, I5, I6, I7, I8, T8]);
          // - coin([Ø, Ø])       [C4 C5]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([Ø, Ø])   [I2 I5 I6]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page)
          // - token([Ø, 7])      [T2]           boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: all ops <= 6 kept, boundBlock from internal applies
          expect(summarize(result)).toEqual({
            ops: ops(I6, C5, I5, C4, I2, T2),
            pagingState: paging(7, { coin: true, internal: false, token: true }),
          });
        });

        it("handles empty token result with boundBlock from internal", async () => {
          const result = await callGetOperations("asc")([I2, C4, C5, I5, I6, I7, I8, T8]);
          // - coin([Ø, Ø])       [C4 C5]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([Ø, Ø])   [I2 I5 I6]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page)
          // - token([Ø, 7])      []             boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: coin + internal ops kept
          expect(summarize(result)).toEqual({
            ops: ops(I6, C5, I5, C4, I2),
            pagingState: paging(7, { coin: true, internal: false, token: true }),
          });
        });

        it("handles all endpoints with full pages at same block", async () => {
          const result = await callGetOperations("asc")([
            C5,
            C5,
            C5,
            I5,
            I5,
            I5,
            T5,
            T5,
            T5,
            C8,
            T8,
            I8,
          ]);
          // - coin([Ø, Ø])       [C5 C5 C5]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([Ø, 6])   [I5 I5 I5]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page, same boundBlock)
          // - token([Ø, 6])      [T5 T5 T5]     boundBlock=6, isPageFull=true,  hasMorePage=true  (full page, same boundBlock)
          // Result: all 9 ops at block 5 kept, all below boundBlock=6
          expect(summarize(result)).toEqual({
            ops: ops(C5, C5, C5, I5, I5, I5, T5, T5, T5),
            pagingState: paging(6, { coin: false, internal: true, token: true }),
          });
        });

        it("returns empty when all endpoints return empty", async () => {
          const result = await callGetOperations("asc")([]);
          // - coin([Ø, Ø])       []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - internal([Ø, Ø])   []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // - token([Ø, Ø])      []             boundBlock=Ø, isPageFull=false, hasMorePage=false (no ops)
          // Result: empty, no pagination needed
          expect(summarize(result)).toEqual({ ops: [], pagingState: undefined });
        });
      });

      describe("with pagination token", () => {
        it("uses token as fromBlock for all calls", async () => {
          const result = await callGetOperations("asc")(
            [T2, I2, C2, C4, I4, C5, I5, C6, I7, I8, C8, T8],
            {
              pagingState: paging(4, { coin: false, internal: false, token: false }),
            },
          );
          // pagingState.boundBlock=4 acts as fromBlock for all endpoints
          // - coin([4, Ø])       [C4 C5 C6]     boundBlock=7, isPageFull=true,  hasMorePage=true  (full page)
          // - internal([4, 7])   [I4 I5]        boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // - token([4, 7])      []             boundBlock=7, isPageFull=false, hasMorePage=true  (bounded by boundBlock < toBlock)
          // Result: C4/C5/C6 + I4/I5 kept, T2/I2/C2 excluded by pagingToken
          expect(summarize(result)).toEqual({
            ops: ops(C6, C5, I5, C4, I4),
            pagingState: paging(7, { coin: false, internal: true, token: true }),
          });
        });
      });

      describe("with fromBlock and toBlock", () => {
        it("uses toBlock and cascades boundBlock when page is full", async () => {
          // C7 added to ensure coin has more ops (hasMorePage=true after boundBlock=6)
          const result = await callGetOperations("asc")(
            [T1, I1, C1, C4, I4, C5, I5, C6, C7, I7, I8, C8, T8],
            {
              fromBlock: 3,
              toBlock: 7,
            },
          );
          // fromBlock=3, toBlock=7 restricts all endpoints
          // - coin([3, 7])       [C4 C5 C6]+[C7] boundBlock=6, isPageFull=true,  hasMorePage=true  (full page + more)
          // - internal([3, 6])   [I4 I5]         boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded)
          // - token([3, 6])      []              boundBlock=Ø, isPageFull=false, hasMorePage=false (bounded)
          // Result: ops in [3, 6] kept, C7/I7/T1/I1/C1 excluded
          expect(summarize(result)).toEqual({
            ops: ops(C6, C5, I5, C4, I4),
            pagingState: paging(7, { coin: false, internal: true, token: true }),
          });
        });

        it("reaches toBlock and returns no pagination token", async () => {
          const result = await callGetOperations("asc")(
            [C1, T3, C3, C4, I4, I5, I7, I8, C8, T8, C9],
            {
              fromBlock: 3,
              toBlock: 7,
            },
          );
          // fromBlock=3, toBlock=7, highest ops reach toBlock
          // - coin([3, 7])       [C3 C4]        boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // - internal([3, Ø])   [I4 I5 I7]     boundBlock=Ø, isPageFull=true,  hasMorePage=false (full but reached toBlock)
          // - token([3, Ø])      [T3]           boundBlock=Ø, isPageFull=false, hasMorePage=false (not full)
          // Result: all ops in [3, 7] kept, no nextPagingToken (reached toBlock)
          expect(summarize(result)).toEqual({
            ops: ops(I7, I5, C4, I4, C3, T3),
            pagingState: undefined,
          });
        });
      });
    });
  });

  describe("exhaustEndpoint", () => {
    const LIMIT = 3;

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

    // Smart mock that paginates based on the page and limit parameters
    const createPaginatedMock = (allBlockHeights: number[]) => {
      return jest.fn(
        (params: ETHERSCAN_API.FetchOperationsParams): Promise<ETHERSCAN_API.EndpointResult> => {
          const page = params.page ?? 1;
          const pageLimit = params.limit ?? allBlockHeights.length;
          const startIndex = (page - 1) * pageLimit;
          const pageBlockHeights = allBlockHeights.slice(startIndex, startIndex + pageLimit);
          const ops = createOps(pageBlockHeights);
          const isPageFull = ops.length >= pageLimit;
          const hasMore = startIndex + pageLimit < allBlockHeights.length;

          return Promise.resolve({
            operations: ops,
            isDone: ops.length === 0 || !isPageFull || !hasMore,
            boundBlock: ops.length > 0 ? Math.max(...ops.map(op => op.blockHeight ?? 0)) : 0,
            isPageFull,
          });
        },
      );
    };

    it.each([
      {
        ops: [1, 2, 3, 4, 5, 6],
        expected: { blocks: [1, 2, 3], isDone: false, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [3, 3, 3, 3, 3, 3, 4, 5, 6],
        expected: { blocks: [3, 3, 3, 3, 3, 3], isDone: false, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [1, 2, 3, 3, 3, 3, 3, 4, 5],
        expected: { blocks: [1, 2, 3, 3, 3, 3, 3], isDone: false, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [1, 2, 3, 3, 3, 3],
        expected: { blocks: [1, 2, 3, 3, 3, 3], isDone: true, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [1, 2, 3, 3, 3, 3, 3, 3],
        expected: {
          blocks: [1, 2, 3, 3, 3, 3, 3, 3],
          isDone: true,
          isPageFull: true,
          boundBlock: 3,
        },
      },
      {
        ops: [1, 2, 3, 3, 3, 3, 4, 5],
        expected: { blocks: [1, 2, 3, 3, 3, 3], isDone: false, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [3, 3, 3],
        expected: { blocks: [3, 3, 3], isDone: true, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [1, 2, 3],
        expected: { blocks: [1, 2, 3], isDone: true, isPageFull: true, boundBlock: 3 },
      },
      {
        ops: [1, 2],
        expected: { blocks: [1, 2], isDone: true, isPageFull: false, boundBlock: 2 },
      },
      {
        ops: [5],
        expected: { blocks: [5], isDone: true, isPageFull: false, boundBlock: 5 },
      },
      {
        ops: [],
        expected: { blocks: [], isDone: true, isPageFull: false, boundBlock: 0 },
      },
      {
        ops: [1, 2, 3, 3, 4, 5],
        expected: { blocks: [1, 2, 3, 3], isDone: false, isPageFull: true, boundBlock: 3 },
      },
    ])("ops $ops", async ({ ops, expected }) => {
      const mockFetch = createPaginatedMock(ops);

      const result = await ETHERSCAN_API.exhaustEndpoint(mockFetch, {
        currency,
        address: account.freshAddress,
        accountId: account.id,
        fromBlock: 0,
        limit: LIMIT,
        sort: "desc",
      });

      expect({
        isPageFull: result.isPageFull,
        isDone: result.isDone,
        boundBlock: result.boundBlock,
        blocks: result.operations.map(op => op.blockHeight),
      }).toEqual(expected);
    });
  });
});

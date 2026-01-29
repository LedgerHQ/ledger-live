import { AssertionError, fail } from "assert";
import axios from "axios";
import BigNumber from "bignumber.js";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EtherscanLikeExplorerUsedIncorrectly } from "../../../../errors";
import * as ETHERSCAN_API from "../../../../network/explorer/etherscan";
import { makeAccount } from "../../../../fixtures/common.fixtures";
import {
  etherscanCoinOperations,
  etherscanERC1155Operations,
  etherscanERC721Operations,
  etherscanInternalOperations,
  etherscanTokenOperations,
} from "../../../../fixtures/etherscan.fixtures";
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

// Factory to create fetch utilities for isPageFull/hasMorePage tests
const createFetchWithLimit =
  <T>(
    apiFn: (
      currency: CryptoCurrency,
      address: string,
      accountId: string,
      fromBlock: number,
      toBlock?: number,
      limit?: number,
      sort?: "asc" | "desc",
    ) => Promise<ETHERSCAN_API.EndpointResult>,
  ) =>
    async (ops: T[], limit: number | undefined, sort: "asc" | "desc" = "desc") => {
      jest.spyOn(axios, "request").mockResolvedValueOnce({
        data: { result: ops },
      });
      return apiFn(currency, account.freshAddress, account.id, 0, undefined, limit, sort);
    };

// Helper to extract pagination state for assertions
const paginationState = (result: ETHERSCAN_API.EndpointResult) => ({
  isPageFull: result.isPageFull,
  hasMorePage: result.hasMorePage,
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
      const SpyError = class SpyError extends Error { };

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

    it("should return a flat list of coin transactions from block 0 for an unlimited page", async () => {
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

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getCoinOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getCoinOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
        100,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: etherscanCoinOperations
          .map(op => etherscanOperationToOperations(account.id, op))
          .flat(),
        hasMorePage: false,
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

    describe("isPageFull and hasMorePage", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getCoinOperations);

      // etherscanCoinOperations: 3 raw ops => 4 processed ops (one self-send creates 2 ops)
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanCoinOperations,
          etherscanCoinOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined (= unlimited page) with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit(etherscanCoinOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined (= unlimited page) without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getTokenOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getTokenOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
        100,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
          etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
        ].flat(),
        hasMorePage: false,
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

    describe("isPageFull and hasMorePage", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getTokenOperations);

      // etherscanTokenOperations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanTokenOperations,
          etherscanTokenOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit(etherscanTokenOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getERC721Operations(
        currency,
        account.freshAddress,
        account.id,
        50,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getERC721Operations(
        currency,
        account.freshAddress,
        account.id,
        50,
        100,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
          etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

    describe("isPageFull and hasMorePage", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC721Operations);

      // etherscanERC721Operations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC721Operations,
          etherscanERC721Operations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit(etherscanERC721Operations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getERC1155Operations(
        currency,
        account.freshAddress,
        account.id,
        50,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getERC1155Operations(
        currency,
        account.freshAddress,
        account.id,
        50,
        100,
      );

      expect(response.operations.length).toBe(4);
      expect(response).toEqual({
        operations: [
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
          etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
        ].flat(),
        hasMorePage: false,
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

    describe("isPageFull and hasMorePage", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getERC1155Operations);

      // etherscanERC1155Operations: 3 raw ops => 4 processed ops
      const expectedProcessedOpsCount = 4;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanERC1155Operations,
          etherscanERC1155Operations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit(etherscanERC1155Operations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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
      expect(response.operations.length).toBe(8);
      expect(response).toEqual({
        operations: sortedOps,
        hasMorePage: false,
        boundBlock: 14049909,
        isPageFull: true,
      });
    });

    describe("isPageFull and hasMorePage", () => {
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
        return ETHERSCAN_API.getNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          limit,
          sort,
        );
      };

      // etherscanERC721Operations (3) + etherscanERC1155Operations (3) => 8 processed ops
      const expectedProcessedOpsCount = 8;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          etherscanERC721Operations.length + etherscanERC1155Operations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          etherscanERC721Operations.length, // limit matches one of the endpoints
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchNftOperationsWithLimit(
          etherscanERC721Operations,
          etherscanERC1155Operations,
          undefined,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchNftOperationsWithLimit([], [], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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
        return ETHERSCAN_API.getNftOperations(
          currency,
          account.freshAddress,
          account.id,
          0,
          undefined,
          undefined,
          sort,
        );
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

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getInternalOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
      );

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        hasMorePage: false,
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

      const response = await ETHERSCAN_API.getInternalOperations(
        currency,
        account.freshAddress,
        account.id,
        50,
        100,
      );

      expect(response.operations.length).toBe(3);
      expect(response).toEqual({
        operations: [
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
          etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
        ].flat(),
        hasMorePage: false,
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

    describe("isPageFull and hasMorePage", () => {
      const fetchWithLimit = createFetchWithLimit(ETHERSCAN_API.getInternalOperations);

      // etherscanInternalOperations: 4 raw ops => 3 processed ops (self-send excluded)
      const expectedProcessedOpsCount = 3;

      it("limit > nb ops => isPageFull = false, hasMorePage = false", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length + 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: false,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit = nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit < nb ops => isPageFull = true, hasMorePage = true", async () => {
        const result = await fetchWithLimit(
          etherscanInternalOperations,
          etherscanInternalOperations.length - 1,
        );
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: true,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined with ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit(etherscanInternalOperations, undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
          nbOps: expectedProcessedOpsCount,
        });
      });

      it("limit undefined without ops => isPageFull = true, hasMorePage = false", async () => {
        const result = await fetchWithLimit([], undefined);
        expect(paginationState(result)).toEqual({
          isPageFull: true,
          hasMorePage: false,
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

    it("should not return NFT opperation", async () => {
      const response = await ETHERSCAN_API.getNftOperations(
        currency,
        account.freshAddress,
        account.id,
        0,
      );
      expect(response).toEqual({
        operations: [],
        hasMorePage: false,
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

    // We will refactor those tests about cascading block range
    // make sure the NFT calls are not included in the test (there is a thing with env see index.integ.test.ts)
    // so we have only 3 calls cascading: coin, internal, token
    // for the sake of simplicity of the tests, we assume that exhaustEndpoint is working perfectly, and it is tested separately (no case with same height spreading over multiple pages)
    // you will have to implement an intelligent mock that provided the operations of the block chain, it can return the correct operations for the given limi and range
    // range: is the range of block chain the search is made on, idependent of sort mode, fromBlock is lower bound, toBlock is upper bound: [fromBlock, toBlock] with fromBlock <= toBlock
    
    // -- given desc mode, limit=3, fromBlock=Ø, toBlock=Ø, token=Ø

    // ---- scenarios where we have to drop some operations
    // these scenarios occurs when the next call have all the operations after the previous call's highest block

    // scenario where we have to drop the full result of "coin" call because next call have all the operations after it's highest block
    // given all ops (top to bottom): [I6 I6 I6 T5 C4 C3 C2]
    // calls with range:
    // - coin([Ø, Ø])             [C4 C3 C2]      boundBlock = 2, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([2, Ø])         [I6 I6 I6]      boundBlock = 6, isPageFull=true, hasMorePage=true (because it's full page)
    // - token([6, Ø])            []              boundBlock = 6, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // need to drop any operation < boundBlock
    // returns                    [I6 I6 I6]      pagination token = "5"

    // scenario where we have to drop the full result of "coin" call because all next calls have all the operations after it's highest block
    // given all ops (top to bottom): [T7 I6 I6 I6 T5 C4 C3 C2 I2]
    // calls with range:
    // - coin([Ø, Ø])             [C4 C3 C2]      boundBlock = 2, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([2, Ø])         [I6 I6 I6]      boundBlock = 6, isPageFull=true, hasMorePage=true (because it's full page and bounded by boundBlock > fromBlock)
    // - token([6, Ø])            [T7]            boundBlock = 6, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // need to drop any operation < boundBlock
    // returns                    [T7 I6 I6 I6]   pagination token = "5"

    // scenario where we have to drop the full result of "coin" and "internal" calls (a bit like scenario 1)
    // given all ops (top to bottom): [T9 T8 T7 I6 I5 I4 C3 C2 C1 I1 T1]
    // calls with range:
    // - coin([Ø, Ø])             [C3 C2 C1]      boundBlock = 1, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([1, Ø])         [I6 I5 I4]      boundBlock = 4, isPageFull=true, hasMorePage=true (because it's full page and bounded by boundBlock > fromBlock)
    // - token([4, Ø])            [T9 T8 T7]      boundBlock = 7, isPageFull=true, hasMorePage=true (because it's full page and because it's bounded by boundBlock > fromBlock)
    // need to drop any operation < boundBlock
    // returns                    [T9 T8 T7]      pagination token = "6"

    // scenario where we have to drop partial results in "coin" and "internal"calls because all next calls have some operations after it's highest block
    // given all ops (top to bottom): [T9 T8 I8 T7 I7 C7 I6 C6 T6 C5 T1 I1]
    // calls with range:
    // - coin([Ø, Ø])             [C7 C6 C5]      boundBlock = 5, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([5, Ø])         [I8 I7 I6]      boundBlock = 6, isPageFull=true, hasMorePage=true (because it's full page and bounded by boundBlock > fromBlock)
    // - token([6, Ø])            [T9 T8 T7]      boundBlock = 7, isPageFull=true, hasMorePage=true (because it's full page and because it's bounded by boundBlock > fromBlock)
    // need to drop any operation < boundBlock
    // returns                    [T9 T8 I8 T7 I7 C7]   pagination token = "6"

    // ---- scenarios where we don't have to drop operations

    // scenario where we don't have to drop the full result of "coin" call because all next calls have all the ops before it's highest block but they hasMorePage = false
    // given all ops (top to bottom): [I6 I6 T5 C4 C3 C2 C1 T1]
    // calls with range:
    // - coin([Ø, Ø])             [C4 C3 C2]     boundBlock = 2, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([2, Ø])         [I6 I6]        boundBlock = 2, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([2, Ø])            [T5]           boundBlock = 2, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [I6 I6 T5 C4 C3 C2]     pagination token = "1"
    // note: with improvement of exhaustEndpoint, we could return [I6 I6 T5 C4 C3 C2] with pagination token = Ø (no more page)

    // scenario where all calls have hasMorePage = false
    // given all ops (top to bottom): [I6 T5 C4]
    // calls with range:
    // - coin([Ø, Ø])             [C4]            boundBlock = Ø (not full page), isPageFull=false, hasMorePage=false
    // - internal([Ø, Ø])         [I6]            boundBlock = Ø, isPageFull=false, hasMorePage=false
    // - token([Ø, Ø])            [T5]            boundBlock = Ø, isPageFull=false, hasMorePage=false
    // returns                    [I6 T5 C4]      pagination token = Ø (no more page)

    // scenario degenerated where all other calls have no operations but "coin" call is full page
    // given all ops (top to bottom): [C4 C3 C2 C1]
    // calls with range:
    // - coin([Ø, Ø])             [C4 C3 C2]     boundBlock = 2, isPageFull=true, hasMorePage=true (because it's full page)
    // - internal([2, Ø])         []             boundBlock = 2, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([2, Ø])            []             boundBlock = 2, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [C4 C3 C2]     pagination token = "1"

    // scenario degenerated where all other calls have no operations but "token" call is full page
    // given all ops (top to bottom): [T4 T3 T2 T1]
    // calls with range:
    // - coin([Ø, Ø])             []             boundBlock = Ø, isPageFull=false, hasMorePage=false
    // - internal([Ø, Ø])         []             boundBlock = Ø, isPageFull=false, hasMorePage=false
    // - token([Ø, Ø])            [T4 T3 T2]     boundBlock = 2, isPageFull=true, hasMorePage=true (because it's full page)
    // returns                    [T4 T3 T2]     pagination token = "1"

    // scenario happy where calls are cascading without dropping any operations
    // given all ops (top to bottom): [T6 C5 I5 C4 I4 C3 I2 I1 C1 T1]
    // calls with range:
    // - coin([Ø, Ø])             [C5 C4 C3]     boundBlock = 3, isPageFull=true,  hasMorePage=true (because it's full page)
    // - internal([3, Ø])         [I5 I4]        boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([3, Ø])            [T6]           boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [T6 I5 C5 I4 C4 C3]        pagination token = "2"

    // scenario where the bounding block is provided by internal call
    // given all ops (top to bottom): [T6 I6 C5 C4 I4 I3 I2 I1 T1]
    // calls with range:
    // - coin([Ø, Ø])             [C5 C4]        boundBlock = Ø, isPageFull=false,  hasMorePage=false (because it's unbounded and ops < limit)
    // - internal([Ø, Ø])         [I6 I4 I3]     boundBlock = 3, isPageFull=true, hasMorePage=true (because it's full page)
    // - token([3, Ø])            [T6]           boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [T6 I6 C5 C4 I4 I3]        pagination token = "2"

    // scenario where the bounding block is provided by internal call and token call yield empty page
    // given all ops (top to bottom): [I6 C5 C4 I4 I3 I2 I1 T1]
    // calls with range:
    // - coin([Ø, Ø])             [C5 C4]        boundBlock = Ø, isPageFull=false,  hasMorePage=false (because it's unbounded and ops < limit)
    // - internal([Ø, Ø])         [I6 I4 I3]     boundBlock = 3, isPageFull=true, hasMorePage=true (because it's full page)
    // - token([3, Ø])            []             boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [I6 C5 C4 I4 I3]        pagination token = "2"

    // scenario  where all endpoints return full pages at the same block
    // given all ops (top to bottom): [C4 C4 C4 I4 I4 I4 T4 T4 T4 C1 T1 I1]
    // calls with range:
    // - coin([Ø, Ø])             [C4 C4 C4]     boundBlock = 4, isPageFull=true,  hasMorePage=true (because it's full page)
    // - internal([4, Ø])         [I4 I4 I4]     boundBlock = 4, isPageFull=true, hasMorePage=true (because it's full page and bounded by boundBlock > fromBlock)
    // - token([4, Ø])            [T4 T4 T4]     boundBlock = 4, isPageFull=true, hasMorePage=true (because it's full page and bounded by boundBlock > fromBlock)
    // returns                    [C4 C4 C4 I4 I4 I4 T4 T4 T4]        pagination token = "3"

    // scenario where all endpoints return empty
    // given all ops (top to bottom): []
    // calls with range:
    // - coin([Ø, Ø])             []             boundBlock = Ø, isPageFull=false, hasMorePage=false (because it's unbounded and ops < limit)
    // - internal([Ø, Ø])         []             boundBlock = Ø, isPageFull=false, hasMorePage=false (because it's unbounded and ops < limit)
    // - token([Ø, Ø])            []             boundBlock = Ø, isPageFull=false, hasMorePage=false (because it's unbounded and ops < limit)
    // returns                    []             pagination token = Ø (no more page)

    // -- given desc mode, limit=3, fromBlock=Ø, toBlock=Ø, token=5

    // ---- scenarios where token is provided and used as toBlock for all calls

    // scenario where the token is provided and used as toBlock
    // given all ops (top to bottom): [T6 I6 C6 C5 I5 C4 I4 C3 I2 I1 C1 T1]
    // calls with range:
    // - coin([Ø, 5])             [C5 C4 C3]     boundBlock = 3, isPageFull=true,  hasMorePage=true (because it's full page)
    // - internal([3, 5])         [I5 I4]        boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([3, 5])            []             boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [I5 C5 I4 C4 C3]        pagination token = "2"

    // -- given desc mode, limit=3, fromBlock=Ø, toBlock=6, token=5

    // ---- scenarios where token is provided and used as toBlock for all calls (user input toBlock is discarded and replaced by token)

    // scenario where the token is provided and used as toBlock
    // given all ops (top to bottom): [T6 I6 C6 C5 I5 C4 I4 C3 I2 I1 C1 T1]
    // calls with range:
    // - coin([Ø, 5])             [C5 C4 C3]     boundBlock = 3, isPageFull=true,  hasMorePage=true (because it's full page)
    // - internal([3, 5])         [I5 I4]        boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([3, 5])            []             boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [I5 C5 I4 C4 C3]        pagination token = "2"

    // -- given desc mode, limit=3, fromBlock=2, toBlock=6, token=Ø

    // ---- scenarios where fromBlock is provided, and may be overriden by boundBlock

    // scenario where fromBlock is provided and overriden by boundBlock
    // given all ops (top to bottom): [T7 I7 C7 C5 I5 C4 I4 C3 I2 I1 C1 T1]
    // calls with range:
    // - coin([2, 6])             [C5 C4 C3]     boundBlock = 3, isPageFull=true,  hasMorePage=true (because it's full page)
    // - internal([3, 6])         [I5 I4]        boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // - token([3, 6])            []             boundBlock = 3, isPageFull=false, hasMorePage=true (because it's bounded by boundBlock > fromBlock)
    // returns                    [I5 C5 I4 C4 C3]        pagination token = "2"

    // scenario where fromBlock is provided and never overriden by boundBlock, and boundBlock = fromBlock for internal call
    // given all ops (top to bottom): [C7 T6 C6 C5 I5 I4 I2 I1 C1 T1 C0]
    // calls with range:
    // - coin([2, 6])             [C6 C5]        boundBlock = Ø, isPageFull=false,  hasMorePage=false (because unbounded by boundBlock and ops < limit within from/to)
    // - internal([2, 6])         [I5 I4 I2]     boundBlock = Ø (bec. same as fromBlock, could be 2 also), isPageFull=true, hasMorePage=false (because it reached fromBlock)
    // - token([2, 6])            [T6]           boundBlock = Ø, isPageFull=false, hasMorePage=false (because unbounded by boundBlock and ops < limit within from/to)
    // returns                    [C6 T6 C5 I5 I4 I2]        pagination token = Ø (because reached original fromBlock)

    //
    it("should cascade block range from coin to internal when coin returns full page", async () => {
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
      // In desc mode, the cascade affects startBlock (fromBlock), not endBlock
      expect((internalCall![0] as any).params.startBlock).toBe(coinBlockHeight);
    });

    it("should cascade block range through all endpoints sequentially when pages are full", async () => {
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
      // In desc mode, the cascade affects startBlock (fromBlock), not endBlock
      expect((tokenCall![0] as any).params.startBlock).toBe(internalMaxBlock);
    });

    it("should cascade to min(callerToBlock, boundBlock) when page is full", async () => {
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
      // In desc mode, the cascade affects startBlock (fromBlock), not endBlock
      const internalCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "internal",
      );
      expect(internalCall).toBeDefined();
      expect((internalCall![0] as any).params.startBlock).toBe(coinMaxBlock);
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
      const internalCall = calls.find(call => getEndpointType((call[0] as any).url) === "internal");
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

      // Internal call uses effectiveBoundBlock after coin = min(undefined, 180) = 180
      // In desc mode, the cascade affects startBlock (fromBlock), not endBlock
      const internalCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "internal",
      );
      expect((internalCall![0] as any).params.startBlock).toBe(coinMaxBlock);

      // Token call uses effectiveBoundBlock after internal = min(180, 200) = 180
      // Note: internal returns 200 which is > 180, so no update, stays at 180
      const tokenCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "token",
      );
      expect((tokenCall![0] as any).params.startBlock).toBe(coinMaxBlock);

      // NFT call uses effectiveBoundBlock after token = min(180, 150) = 150
      const nftCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "erc721",
      );
      expect(nftCall).toBeDefined();
      expect((nftCall![0] as any).params.startBlock).toBe(tokenMaxBlock);
    });

    it("should not cascade block range when limit is undefined (unlimited page)", async () => {
      const callerToBlock = 200;
      const coinMaxBlock = 150;

      // Track calls per endpoint to return empty on page 2+
      const coinCallCount = { count: 0 };
      const spy = jest.spyOn(axios, "request").mockImplementation(async config => {
        const url = config.url as string;
        if (getEndpointType(url) === "coin") {
          coinCallCount.count++;
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
        undefined, // limit undefined = unlimited page
      );

      // Coin call should use callerToBlock
      const coinCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "coin",
      );
      expect(coinCall).toBeDefined();
      expect((coinCall![0] as any).params.endBlock).toBe(callerToBlock);

      // Even though coin returned ops at block 150, internal should still use callerToBlock (200)
      // because limit is undefined, so effectiveMaxBlock is not updated
      const internalCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "internal",
      );
      expect(internalCall).toBeDefined();
      expect((internalCall![0] as any).params.endBlock).toBe(callerToBlock);

      // Token should also use callerToBlock
      const tokenCall = spy.mock.calls.find(
        call => getEndpointType((call[0] as any).url) === "token",
      );
      expect(tokenCall).toBeDefined();
      expect((tokenCall![0] as any).params.endBlock).toBe(callerToBlock);
    });
  });

  describe("exhaustEndpoint", () => {
    it.each([
      {
        pages: [[1, 2, 3], [3, 3, 3], [3, 4, 5]],
        expected: { blocks: [1, 2, 3, 3, 3, 3, 3], hasMorePage: true, isPageFull: true },
      },
      {
        pages: [[1, 2, 3], []],
        expected: { blocks: [1, 2, 3], hasMorePage: false, isPageFull: true },
      },
      {
        pages: [[1, 2, 3], [3, 3, 3], []],
        expected: { blocks: [1, 2, 3, 3, 3, 3], hasMorePage: false, isPageFull: true },
      },
      {
        pages: [[1, 2, 3], [3, 3, 3], [3, 3]],
        expected: { blocks: [1, 2, 3, 3, 3, 3, 3, 3], hasMorePage: false, isPageFull: true },
      },
      {
        pages: [[1, 2, 3], [3, 3, 3], [4, 5]],
        expected: { blocks: [1, 2, 3, 3, 3, 3], hasMorePage: true, isPageFull: true },
      },
      {
        pages: [[1, 2]],
        expected: { blocks: [1, 2], hasMorePage: false, isPageFull: false },
      },
      {
        pages: [[]],
        expected: { blocks: [], hasMorePage: false, isPageFull: false },
      },
      {
        pages: [[1, 2, 3], [3, 4, 5]],
        expected: { blocks: [1, 2, 3, 3], hasMorePage: true, isPageFull: true },
      },
    ])("pages $pages", async ({ pages, expected }) => {
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

      const pageResult = (blockHeights: number[]): ETHERSCAN_API.EndpointResult => {
        const ops = createOps(blockHeights);
        const isPageFull = blockHeights.length === LIMIT;
        return {
          operations: ops,
          hasMorePage: ops.length > 0 && isPageFull,
          boundBlock: ops.length > 0 ? Math.max(...ops.map(op => op.blockHeight ?? 0)) : 0,
          isPageFull,
        };
      };

      const mockFetch = jest.fn<
        Promise<ETHERSCAN_API.EndpointResult>,
        [any, any, any, any, any, any, any, number?]
      >();
      pages.forEach(page => mockFetch.mockResolvedValueOnce(pageResult(page)));

      const result = await ETHERSCAN_API.exhaustEndpoint(
        mockFetch,
        currency,
        account.freshAddress,
        account.id,
        0,
        undefined,
        LIMIT,
        "desc",
      );

      expect({
        blocks: result.operations.map(op => op.blockHeight),
        hasMorePage: result.hasMorePage,
        isPageFull: result.isPageFull,
      }).toEqual(expected);
    });
  });
});

import { AssertionError, fail } from "assert";
import axios from "axios";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { EtherscanLikeExplorerUsedIncorrectly } from "../../../../errors";
import * as ETHERSCAN_API from "../../../../api/explorer/etherscan";
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

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

const currency: CryptoCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    explorer: {
      type: "etherscan",
      uri: "mock",
    },
    node: {
      type: "external",
      uri: "mock",
    },
  },
};
const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency);

describe("EVM Family", () => {
  describe("api/explorer/etherscan.ts", () => {
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
        expect(spy).toBeCalledTimes(3);
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
        expect(spy).toBeCalledTimes(3);
      });
    });

    describe("getLastCoinOperations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should throw an error if the currency is misconfigured", async () => {
        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: {
            result: etherscanCoinOperations,
          },
        }));

        try {
          await await ETHERSCAN_API.getLastCoinOperations(
            {
              ...currency,
              ethereumLikeInfo: {
                chainId: 1,
                // no explorer
              } as EthereumLikeInfo,
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

        expect(response).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.length).toBe(4);
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlist&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.length).toBe(4);
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlist&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          etherscanCoinOperations.map(op => etherscanOperationToOperations(account.id, op)).flat(),
        );
        expect(response.length).toBe(4);
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlist&address=${account.freshAddress}`,
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
                // no explorer
              } as EthereumLikeInfo,
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

        expect(response).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokentx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokentx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[0], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[1], 0),
            etherscanERC20EventToOperations(account.id, etherscanTokenOperations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokentx&address=${account.freshAddress}`,
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
                // no explorer
              } as EthereumLikeInfo,
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

        expect(response).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokennfttx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokennfttx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[0], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[1], 0),
            etherscanERC721EventToOperations(account.id, etherscanERC721Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=tokennfttx&address=${account.freshAddress}`,
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
                // no explorer
              } as EthereumLikeInfo,
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

        expect(response).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=token1155tx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=token1155tx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[0], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[1], 0),
            etherscanERC1155EventToOperations(account.id, etherscanERC1155Operations[2], 1),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=token1155tx&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          response.slice().sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
      });
    });

    describe("getLastInternalOperations", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should throw if the currency is misconfigured", async () => {
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
                // no explorer
              } as EthereumLikeInfo,
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

        expect(response).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlistinternal&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlistinternal&address=${account.freshAddress}`,
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

        expect(response).toEqual(
          [
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[0], 0),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[1], 1),
            etherscanInternalTransactionToOperations(account.id, etherscanInternalOperations[2], 0),
          ].flat(),
        );
        expect(spy).toBeCalledWith({
          method: "GET",
          url: `mock/api?module=account&action=txlistinternal&address=${account.freshAddress}`,
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
  });
});

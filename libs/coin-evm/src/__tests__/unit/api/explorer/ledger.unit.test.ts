import { AssertionError, fail } from "assert";
import eip55 from "eip55";
import axios from "axios";
import BigNumber from "bignumber.js";
import { delay } from "@ledgerhq/live-promise";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { LedgerExplorerUsedIncorrectly } from "../../../../errors";
import * as LEDGER_API from "../../../../api/explorer/ledger";
import {
  coinOperation1,
  coinOperation2,
  coinOperation3,
  coinOperation4,
} from "../../../fixtures/explorer/ledger.fixtures";

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

const fakeCurrency = Object.freeze({
  id: "ethereum" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
    explorer: {
      type: "ledger",
      explorerId: "eth",
    },
  },
}) as CryptoCurrency;

const accountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "ethereum",
  xpubOrAddress: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
  derivationMode: "",
});

describe("EVM Family", () => {
  describe("api/explorer/ledger.ts", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    describe("fetchPaginatedOpsWithRetries", () => {
      it("should retry on fail", async () => {
        let retries = 2;
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new Error();
          }
          return { data: { data: [] } };
        });
        const response = await LEDGER_API.fetchPaginatedOpsWithRetries(
          {} as any,
          null,
          [],
          retries,
        );

        expect(response).toEqual([]);
        // it should fail 2 times and succeed on the next try
        expect(spy).toBeCalledTimes(3);
      });

      it("should throw after too many retries", async () => {
        const SpyError = class SpyError extends Error {};

        let retries = LEDGER_API.DEFAULT_RETRIES_API + 1;
        jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new SpyError();
          }
          return { data: { data: [] } };
        });
        try {
          await LEDGER_API.fetchPaginatedOpsWithRetries({} as any, null);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(SpyError);
        }
      });

      it("should recursively fetch paginated data", async () => {
        jest.spyOn(axios, "request").mockImplementation(async ({ params }) => {
          switch (params.token) {
            case "abc":
              return {
                data: {
                  data: [coinOperation2],
                  token: "def",
                },
              };
            case "def": {
              return {
                data: {
                  data: [coinOperation3],
                  token: null,
                },
              };
            }
            default: {
              return {
                data: {
                  data: [coinOperation1],
                  token: "abc",
                },
              };
            }
          }
        });

        const response = await LEDGER_API.fetchPaginatedOpsWithRetries({} as any, null);

        expect(response).toEqual([coinOperation1, coinOperation2, coinOperation3]);
      });

      it("should use the right header", async () => {
        const oldEnv = getEnv("LEDGER_CLIENT_VERSION");
        setEnv("LEDGER_CLIENT_VERSION", "TEST");

        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          return { data: { data: [] } };
        });
        await LEDGER_API.fetchPaginatedOpsWithRetries({} as any, null);

        setEnv("LEDGER_CLIENT_VERSION", oldEnv);
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: { "X-Ledger-Client-Version": "TEST" },
          }),
        );
      });
    });

    describe("getLastOperations", () => {
      it("should throw if the explorer is misconfigured", async () => {
        const badCurrency = {
          id: "ethereum" as CryptoCurrencyId,
          ethereumLikeInfo: {
            chainId: 1,
            node: {
              type: "wrongtype",
              uri: "anything",
            } as any,
          },
        } as CryptoCurrency;
        try {
          await LEDGER_API.getLastOperations(
            badCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            accountId,
            0,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerExplorerUsedIncorrectly);
        }
      });

      it("should return the different operation types", async () => {
        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: { data: [coinOperation1, coinOperation2, coinOperation3, coinOperation4] },
        }));

        const response = await LEDGER_API.getLastOperations(
          fakeCurrency,
          "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          accountId,
          0,
        );

        expect(response).toEqual({
          lastCoinOperations: [
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-FEES",
              accountId,
              blockHash: coinOperation1.block.hash,
              blockHeight: coinOperation1.block.height,
              date: new Date(coinOperation1.block.time),
              extra: {},
              fee: new BigNumber(coinOperation1.gas_used).times(coinOperation1.gas_price),
              hash: coinOperation1.hash,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              recipients: [eip55.encode(coinOperation1.to)],
              senders: [eip55.encode(coinOperation1.from)],
              transactionSequenceNumber: coinOperation1.nonce_value,
              type: "FEES",
              value: new BigNumber(coinOperation1.value).plus(
                new BigNumber(coinOperation1.gas_used).times(coinOperation1.gas_price),
              ),
            },
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT",
              accountId,
              blockHash: coinOperation2.block.hash,
              blockHeight: coinOperation2.block.height,
              date: new Date(coinOperation2.block.time),
              extra: {},
              fee: new BigNumber(coinOperation2.gas_used).times(coinOperation2.gas_price),
              hash: coinOperation2.hash,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              recipients: [eip55.encode(coinOperation2.to)],
              senders: [eip55.encode(coinOperation2.from)],
              transactionSequenceNumber: coinOperation2.nonce_value,
              type: "OUT",
              value: new BigNumber(coinOperation2.value).plus(
                new BigNumber(coinOperation2.gas_used).times(coinOperation2.gas_price),
              ),
            },
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
              accountId,
              blockHash: coinOperation3.block.hash,
              blockHeight: coinOperation3.block.height,
              date: new Date(coinOperation3.block.time),
              extra: {},
              fee: new BigNumber(coinOperation3.gas_used).times(coinOperation3.gas_price),
              hash: coinOperation3.hash,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              recipients: [eip55.encode(coinOperation3.to)],
              senders: [eip55.encode(coinOperation3.from)],
              transactionSequenceNumber: coinOperation3.nonce_value,
              type: "IN",
              value: new BigNumber(coinOperation3.value),
            },
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
              accountId,
              blockHash: coinOperation4.block.hash,
              blockHeight: coinOperation4.block.height,
              date: new Date(coinOperation4.block.time),
              extra: {},
              fee: new BigNumber(coinOperation4.gas_used).times(coinOperation4.gas_price),
              hash: coinOperation4.hash,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              recipients: [eip55.encode(coinOperation4.to)],
              senders: [eip55.encode(coinOperation4.from)],
              transactionSequenceNumber: coinOperation4.nonce_value,
              type: "IN",
              value: new BigNumber(coinOperation4.value),
            },
          ],
          lastNftOperations: [
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:+0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A+49183440411075624253866807957299276245920874859439606792850319902048050479106+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0",
              accountId,
              blockHash: coinOperation2.block.hash,
              blockHeight: coinOperation2.block.height,
              contract: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
              date: new Date(coinOperation2.block.time),
              extra: {},
              fee: new BigNumber(coinOperation2.gas_used).times(coinOperation2.gas_price),
              hash: coinOperation2.hash,
              recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              standard: "ERC721",
              tokenId:
                "49183440411075624253866807957299276245920874859439606792850319902048050479106",
              transactionSequenceNumber: coinOperation2.nonce_value,
              type: "NFT_OUT",
              value: new BigNumber("1"),
            },
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_0",
              accountId,
              blockHash: coinOperation3.block.hash,
              blockHeight: coinOperation3.block.height,
              contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
              date: new Date(coinOperation3.block.time),
              extra: {},
              fee: new BigNumber(coinOperation3.gas_used).times(coinOperation3.gas_price),
              hash: coinOperation3.hash,
              recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              standard: "ERC1155",
              tokenId:
                "49183440411075624253866807957299276245920874859439606792850319904247073734666",
              transactionSequenceNumber: coinOperation3.nonce_value,
              type: "NFT_OUT",
              value: new BigNumber("1"),
            },
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734665+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_1",
              accountId,
              blockHash: coinOperation3.block.hash,
              blockHeight: coinOperation3.block.height,
              contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
              date: new Date(coinOperation3.block.time),
              extra: {},
              fee: new BigNumber(coinOperation3.gas_used).times(coinOperation3.gas_price),
              hash: coinOperation3.hash,
              recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              standard: "ERC1155",
              tokenId:
                "49183440411075624253866807957299276245920874859439606792850319904247073734665",
              transactionSequenceNumber: coinOperation3.nonce_value,
              type: "NFT_OUT",
              value: new BigNumber("2"),
            },
          ],
          lastTokenOperations: [
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT-i0",
              accountId: accountId + "+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin",
              blockHash: coinOperation1.block.hash,
              blockHeight: coinOperation1.block.height,
              contract: eip55.encode(coinOperation1.to),
              date: new Date(coinOperation1.block.time),
              extra: {},
              fee: new BigNumber(coinOperation1.gas_used).times(coinOperation1.gas_price),
              hash: coinOperation1.hash,
              recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              transactionSequenceNumber: coinOperation1.nonce_value,
              type: "OUT",
              value: new BigNumber("100000000000000"),
            },
          ],
          lastInternalOperations: [
            {
              id: "js:2:ethereum:0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN-i0",
              accountId,
              blockHash: coinOperation2.block.hash,
              blockHeight: coinOperation2.block.height,
              date: new Date(coinOperation2.block.time),
              extra: {},
              fee: new BigNumber("0"),
              hasFailed: false,
              hash: coinOperation2.hash,
              recipients: [eip55.encode(coinOperation2.actions[0].to)],
              senders: [eip55.encode(coinOperation2.actions[0].from)],
              type: "IN",
              value: new BigNumber(coinOperation2.actions[0].value),
            },
          ],
        });
      });
    });
  });
});

import { AssertionError, fail } from "assert";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency, CryptoCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import axios from "axios";
import eip55 from "eip55";
import { getCoinConfig } from "../../config";
import { LedgerExplorerUsedIncorrectly } from "../../errors";
import {
  coinOperation1,
  coinOperation2,
  coinOperation3,
  coinOperation4,
} from "../../fixtures/ledger.fixtures";
import * as LEDGER_API from "./ledger";

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

const fakeCurrency = Object.freeze<Partial<CryptoCurrency>>({
  id: CryptoCurrencyIdSchema.parse("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
  },
}) as CryptoCurrency;

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  describe("network/explorer/ledger.ts", () => {
    beforeEach(() => {
      mockGetConfig.mockImplementation((): any => {
        return {
          info: {
            explorer: {
              type: "ledger",
              explorerId: "eth",
            },
            showNfts: true,
          },
        };
      });
    });

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
        expect(spy).toHaveBeenCalledTimes(3);
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

    describe("getOperations", () => {
      it("should throw if the explorer is misconfigured", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          return {
            info: {
              node: {
                type: "wrongtype",
                uri: "anything",
              },
            },
          };
        });

        const badCurrency = {
          id: "ethereum",
          ethereumLikeInfo: {
            chainId: 1,
          },
        } as CryptoCurrency;

        try {
          await LEDGER_API.getOperations(
            badCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
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

      it.each([
        ["configured", 10, 10],
        ["default", undefined, 10_000],
      ])("uses the %s batch size", async (_s, configuredBatchSize, expectedBatchSize) => {
        mockGetConfig.mockImplementationOnce(() => ({
          info: {
            status: { type: "active" },
            node: { type: "ledger", explorerId: "matic" },
            explorer: { type: "ledger", explorerId: "matic", batchSize: configuredBatchSize },
            showNfts: true,
          },
        }));
        const request = jest.spyOn(axios, "request").mockResolvedValue({ data: { data: [] } });

        await LEDGER_API.getOperations(
          fakeCurrency,
          "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          0,
        );

        expect(request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({ batch_size: expectedBatchSize }),
          }),
        );
      });

      it("should return the different operation types", async () => {
        jest.spyOn(axios, "request").mockImplementation(async () => ({
          data: { data: [coinOperation1, coinOperation2, coinOperation3, coinOperation4] },
        }));

        const response = await LEDGER_API.getOperations(
          fakeCurrency,
          "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          0,
        );

        const addr = "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d";
        const txHash = coinOperation1.hash;
        const blockHash = coinOperation1.block.hash;
        const fees = BigInt(coinOperation1.gas_used) * BigInt(coinOperation1.gas_price);
        const nftReceiver = "0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C";
        const tx1 = {
          hash: txHash,
          block: {
            height: coinOperation1.block.height,
            hash: blockHash,
            time: new Date(coinOperation1.block.time),
          },
          fees,
          date: new Date(coinOperation1.block.time),
          failed: false,
          feesPayer: addr,
        };
        const tx2 = {
          hash: txHash,
          block: {
            height: coinOperation2.block.height,
            hash: blockHash,
            time: new Date(coinOperation2.block.time),
          },
          fees,
          date: new Date(coinOperation2.block.time),
          failed: false,
          feesPayer: addr,
        };
        const tx3 = {
          hash: txHash,
          block: {
            height: coinOperation3.block.height,
            hash: blockHash,
            time: new Date(coinOperation3.block.time),
          },
          fees,
          date: new Date(coinOperation3.block.time),
          failed: false,
          feesPayer: eip55.encode(coinOperation3.from),
        };
        const tx4 = {
          hash: txHash,
          block: {
            height: coinOperation4.block.height,
            hash: blockHash,
            time: new Date(coinOperation4.block.time),
          },
          fees,
          date: new Date(coinOperation4.block.time),
          failed: false,
          feesPayer: eip55.encode(coinOperation4.from),
        };

        expect(response).toEqual({
          lastCoinOperations: [
            {
              id: `${addr}-${txHash}-FEES`,
              type: "FEES",
              senders: [addr],
              recipients: [eip55.encode(coinOperation1.to)],
              value: 0n,
              asset: { type: "native" },
              tx: tx1,
              details: { sequence: 75 },
            },
            {
              id: `${addr}-${txHash}-OUT`,
              type: "OUT",
              senders: [addr],
              recipients: [eip55.encode(coinOperation2.to)],
              value: 10n,
              asset: { type: "native" },
              tx: tx2,
              details: { sequence: 75 },
            },
            {
              id: `${addr}-${txHash}-IN`,
              type: "IN",
              senders: [eip55.encode(coinOperation3.from)],
              recipients: [addr],
              value: 100n,
              asset: { type: "native" },
              tx: tx3,
              details: { sequence: 75 },
            },
            {
              id: `${addr}-${txHash}-IN`,
              type: "IN",
              senders: [eip55.encode(coinOperation4.from)],
              recipients: [addr],
              value: 100n,
              asset: { type: "native" },
              tx: tx4,
              details: { sequence: 75 },
            },
          ],
          lastNftOperations: [
            {
              id: `${txHash}-erc721-0-NFT_OUT`,
              type: "NFT_OUT",
              senders: [addr],
              recipients: [nftReceiver],
              value: 1n,
              asset: {
                type: "erc721",
                assetReference: eip55.encode(coinOperation2.erc721_transfer_events[0].contract),
                assetOwner: addr,
              },
              tx: tx2,
              details: {
                ledgerOpType: "NFT_OUT",
                tokenId: coinOperation2.erc721_transfer_events[0].token_id,
                assetAmount: "1",
                assetSenders: [addr],
                assetRecipients: [nftReceiver],
              },
            },
            {
              id: `${txHash}-erc1155-0-0-NFT_OUT`,
              type: "NFT_OUT",
              senders: [addr],
              recipients: [nftReceiver],
              value: 1n,
              asset: {
                type: "erc1155",
                assetReference: eip55.encode(coinOperation3.erc1155_transfer_events[0].contract),
                assetOwner: addr,
              },
              tx: tx3,
              details: {
                ledgerOpType: "NFT_OUT",
                tokenId: coinOperation3.erc1155_transfer_events[0].transfers[0].id,
                assetAmount: "1",
                assetSenders: [addr],
                assetRecipients: [nftReceiver],
              },
            },
            {
              id: `${txHash}-erc1155-0-1-NFT_OUT`,
              type: "NFT_OUT",
              senders: [addr],
              recipients: [nftReceiver],
              value: 2n,
              asset: {
                type: "erc1155",
                assetReference: eip55.encode(coinOperation3.erc1155_transfer_events[0].contract),
                assetOwner: addr,
              },
              tx: tx3,
              details: {
                ledgerOpType: "NFT_OUT",
                tokenId: coinOperation3.erc1155_transfer_events[0].transfers[1].id,
                assetAmount: "2",
                assetSenders: [addr],
                assetRecipients: [nftReceiver],
              },
            },
          ],
          lastTokenOperations: [
            {
              id: `${txHash}-erc20-0-OUT`,
              type: "OUT",
              senders: [addr],
              recipients: [eip55.encode(coinOperation1.transfer_events[0].to)],
              value: 100000000000000n,
              asset: {
                type: "erc20",
                assetReference: eip55.encode(coinOperation1.transfer_events[0].contract),
                assetOwner: addr,
              },
              tx: tx1,
              details: {
                ledgerOpType: "OUT",
                assetAmount: coinOperation1.transfer_events[0].count,
                assetSenders: [addr],
                assetRecipients: [eip55.encode(coinOperation1.transfer_events[0].to)],
              },
            },
          ],
          lastInternalOperations: [
            {
              id: `${txHash}-internal-0-IN`,
              type: "IN",
              senders: [eip55.encode(coinOperation2.actions[0].from)],
              recipients: [addr],
              value: BigInt(coinOperation2.actions[0].value),
              asset: { type: "native" },
              tx: { ...tx2, fees: 0n },
              details: { internal: true, hasFailed: false },
            },
          ],
          nextPagingToken: "",
        });
      });

      describe("getOperations without nft", () => {
        beforeEach(() => {
          mockGetConfig.mockImplementation((): any => {
            return {
              info: {
                explorer: {
                  type: "ledger",
                  explorerId: "eth",
                },
                showNfts: false,
              },
            };
          });
        });

        it("should not return NFT opperation", async () => {
          jest.spyOn(axios, "request").mockImplementation(async () => ({
            data: { data: [coinOperation1, coinOperation2, coinOperation3, coinOperation4] },
          }));

          const response = await LEDGER_API.getOperations(
            fakeCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            0,
          );
          expect(response.lastNftOperations).toEqual([]);
        });
      });

      describe("nativeContracts filter", () => {
        // coinOperation1.transfer_events[0].contract — the only ERC20 event in the fixtures.
        const FIXTURE_CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

        const withConfig = (info: Record<string, unknown>) =>
          mockGetConfig.mockImplementation((): any => ({
            info: {
              explorer: { type: "ledger", explorerId: "eth" },
              showNfts: true,
              ...info,
            },
          }));

        it("drops ERC20 transfer events whose contract is listed in nativeContracts", async () => {
          withConfig({ nativeContracts: [FIXTURE_CONTRACT] });
          jest.spyOn(axios, "request").mockImplementation(async () => ({
            data: { data: [coinOperation1] },
          }));

          const response = await LEDGER_API.getOperations(
            fakeCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            0,
          );

          expect(response.lastTokenOperations).toEqual([]);
        });

        it("matches nativeContracts case-insensitively", async () => {
          withConfig({ nativeContracts: [FIXTURE_CONTRACT.toUpperCase()] });
          jest.spyOn(axios, "request").mockImplementation(async () => ({
            data: { data: [coinOperation1] },
          }));

          const response = await LEDGER_API.getOperations(
            fakeCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            0,
          );

          expect(response.lastTokenOperations).toEqual([]);
        });

        it("keeps ops on contracts not listed in nativeContracts", async () => {
          withConfig({ nativeContracts: ["0x0000000000000000000000000000000000000001"] });
          jest.spyOn(axios, "request").mockImplementation(async () => ({
            data: { data: [coinOperation1] },
          }));

          const response = await LEDGER_API.getOperations(
            fakeCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            0,
          );

          expect(response.lastTokenOperations).toHaveLength(1);
        });

        it("is a no-op when nativeContracts is undefined", async () => {
          // default beforeEach config has no nativeContracts
          jest.spyOn(axios, "request").mockImplementation(async () => ({
            data: { data: [coinOperation1] },
          }));

          const response = await LEDGER_API.getOperations(
            fakeCurrency,
            "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            0,
          );

          expect(response.lastTokenOperations).toHaveLength(1);
        });
      });
    });
  });
});

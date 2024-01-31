import network from "@ledgerhq/live-network/network";
import { AxiosResponse } from "axios";
import BigNumber from "bignumber.js";
import cryptoFactory from "../chain/chain";
import { CosmosAPI } from "./Cosmos";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import liveConfig from "../../../config/sharedConfig";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

LiveConfig.setConfig(liveConfig);

describe("CosmosApi", () => {
  let cosmosApi: CosmosAPI;

  beforeEach(() => {
    cosmosApi = new CosmosAPI("cosmos");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getAccount", () => {
    it("should return base_account if available", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          account: {
            account_number: 1,
            sequence: 0,
            pub_key: { key: "k", "@type": "type" },
            base_account: {
              account_number: 2,
              sequence: 42,
              pub_key: { key: "k2", "@type": "type2" },
            },
          },
        },
      } as AxiosResponse);

      const account = await cosmosApi.getAccount("addr");
      expect(account.accountNumber).toEqual(2);
      expect(account.sequence).toEqual(42);
      expect(account.pubKey).toEqual("k2");
      expect(account.pubKeyType).toEqual("type2");
    });

    it("should return account if base_account isn't available", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          account: { account_number: 1, sequence: 0, pub_key: { key: "k", "@type": "type" } },
        },
      } as AxiosResponse);

      const account = await cosmosApi.getAccount("addr");
      expect(account.accountNumber).toEqual(1);
      expect(account.sequence).toEqual(0);
      expect(account.pubKey).toEqual("k");
      expect(account.pubKeyType).toEqual("type");
    });

    it("should return default sequence value if network fails", async () => {
      mockedNetwork.mockImplementation(() => {
        throw new Error();
      });
      const account = await cosmosApi.getAccount("addr");
      expect(account.sequence).toEqual(0);
    });

    it("should return default pubkeytype value if network fails", async () => {
      mockedNetwork.mockImplementation(() => {
        throw new Error();
      });
      const account = await cosmosApi.getAccount("addr");
      expect(account.pubKeyType).toEqual(cryptoFactory("cosmos").defaultPubKeyType);
    });
  });

  describe("simulate", () => {
    it("should return gas used when the network call returns gas used", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          gas_info: {
            gas_used: 42000,
          },
        },
      } as AxiosResponse);
      const gas = await cosmosApi.simulate([]);
      expect(gas).toEqual(new BigNumber(42000));
    });

    it("should throw an error when the network call does not return gas used", async () => {
      mockedNetwork.mockResolvedValue({
        data: { gas_info: {} },
      } as AxiosResponse);
      await expect(cosmosApi.simulate([])).rejects.toThrowError();
    });

    it("should throw an error when the network call fails", async () => {
      mockedNetwork.mockImplementation(() => {
        throw new Error();
      });
      await expect(cosmosApi.simulate([])).rejects.toThrowError();
    });
  });

  describe("getTransactions", () => {
    it("should return an empty array when network call fails", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation(() => {
        throw new Error();
      });
      const txs = await cosmosApi.getTransactions("address", 50);
      expect(txs.length).toEqual(0);
    });

    it("should not run into an infinite loop if every call return the same thing", async () => {
      // @ts-expect-error method is mocked
      network.mockResolvedValue({
        data: {
          pagination: { total: 9000 },
          tx_responses: [
            {
              txhash: "txhash",
            },
          ],
        },
      });
      const txs = await cosmosApi.getTransactions("address", 50);
      // one for sender, one for recipient
      expect(txs.length).toEqual(2);
    });

    it("should return both recipient and sender tx", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { method: string; url: string }) => {
        if (networkOptions.url.includes("recipient")) {
          return Promise.resolve({
            data: {
              pagination: { total: 1 },
              tx_responses: [
                {
                  txhash: "recipienthash",
                },
              ],
            },
          });
        } else if (networkOptions.url.includes("sender")) {
          return Promise.resolve({
            data: {
              pagination: { total: 1 },
              tx_responses: [
                {
                  txhash: "senderhash",
                },
              ],
            },
          });
        } else {
          return Promise.resolve({
            data: {
              pagination: { total: 0 },
              tx_responses: [],
            },
          });
        }
      });
      const txs = await cosmosApi.getTransactions("address", 50);
      expect(txs.find(tx => tx.txhash === "senderhash")).toBeDefined();
      expect(txs.find(tx => tx.txhash === "recipienthash")).toBeDefined();
      expect(txs.length).toEqual(2);
    });

    it("should return every pages of transactions", async () => {
      const simulatedTotal = 500;
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { method: string; url: string }) => {
        const pageOffset: string = networkOptions.url.split("pagination.offset=")[1].split("&")[0];

        const pageSize = Number(networkOptions.url.split("pagination.limit=")[1].split("&")[0]);

        return Promise.resolve({
          data: {
            pagination: { total: simulatedTotal },
            tx_responses: Array(pageSize)
              .fill({})
              .map((_, i) => ({
                txhash: `${pageOffset}_${i}`,
              })),
          },
        });
      });
      const txs = await cosmosApi.getTransactions("address", 10);
      // sender + recipient
      expect(txs.length).toEqual(simulatedTotal * 2);
    });
  });
});

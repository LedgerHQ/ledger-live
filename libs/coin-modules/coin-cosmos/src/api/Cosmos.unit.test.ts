import network from "@ledgerhq/live-network/network";
import { Operation } from "@ledgerhq/types-live";
import { AxiosResponse } from "axios";
import BigNumber from "bignumber.js";
import cryptoFactory from "../chain/chain";
import { CosmosAPI } from "./Cosmos";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

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

    it("should return the correct account based on type", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          account: {
            "@type": "/cosmos.auth.v1beta1.BaseAccount",
            account_number: 1,
            sequence: 0,
            pub_key: { key: "k", "@type": "type" },
          },
        },
      } as AxiosResponse);

      const account = await cosmosApi.getAccount("addr");
      expect(account).toEqual({
        accountNumber: 1,
        sequence: 0,
        pubKey: "k",
        pubKeyType: "type",
      });

      mockedNetwork.mockResolvedValue({
        data: {
          account: {
            "@type": "/ethermint.types.v1.EthAccount",
            account_number: 1,
            sequence: 0,
            pub_key: { key: "k", "@type": "type" },

            base_account: {
              address: "address",
              pub_key: { key: "k2", "@type": "type2" },
              account_number: 2,
              sequence: 3,
            },
            code_hash: "codeHash",
          },
        },
      } as AxiosResponse);

      const ethermintAccount = await cosmosApi.getAccount("addr");
      expect(ethermintAccount).toEqual({
        accountNumber: 2,
        sequence: 3,
        pubKey: "k2",
        pubKeyType: "type2",
      });
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

  describe("getRedelegations", () => {
    it("should return redelegations correctly (sdk v0.41/0.42/0.44/0.45)", async () => {
      const getApiResponseSinceSdk041 = {
        redelegation_responses: [
          {
            redelegation: {
              delegator_address: "cosmosDelegatorAddress",
              validator_src_address: "cosmosValidatorSrcAddress",
              validator_dst_address: "cosmosValidatorDstAddress",
              entries: [
                {
                  creation_height: "1",
                  completion_time: "2023-06-04T15:12:58.567Z",
                  initial_balance: "100",
                  shares_dst: "100",
                },
              ],
            },
            entries: [
              {
                redelegation_entry: {
                  creation_height: "1",
                  completion_time: "2023-06-04T15:12:58.567Z",
                  initial_balance: "100",
                  shares_dst: "100",
                },
                balance: "100",
              },
            ],
          },
        ],
        pagination: {
          next_key: null,
          total: "1",
        },
      };
      mockedNetwork.mockResolvedValue({
        data: getApiResponseSinceSdk041,
      } as AxiosResponse);
      const cosmosRedelegations = await cosmosApi.getRedelegations("cosmosDelegatorAddress");
      expect(cosmosRedelegations[0].amount).toEqual(new BigNumber(100));
      expect(cosmosRedelegations[0].completionDate).toEqual(new Date("2023-06-04T15:12:58.567Z"));
      expect(cosmosRedelegations[0].validatorDstAddress).toEqual("cosmosValidatorDstAddress");
      expect(cosmosRedelegations[0].validatorSrcAddress).toEqual("cosmosValidatorSrcAddress");
    });

    it("should return redelegations correctly (sdk v0.46/0.47)", async () => {
      const getApiResponseSinceSdk046 = {
        redelegation_responses: [
          {
            redelegation: {
              delegator_address: "cosmosDelegatorAddress",
              validator_src_address: "cosmosValidatorSrcAddress",
              validator_dst_address: "cosmosValidatorDstAddress",
              entries: null,
            },
            entries: [
              {
                redelegation_entry: {
                  creation_height: 42,
                  completion_time: "2024-04-29T09:38:35.273743543Z",
                  initial_balance: "100",
                  shares_dst: "100.000000000000000000",
                  unbonding_id: 394,
                },
                balance: "100",
              },
            ],
          },
        ],
        pagination: { next_key: null, total: "1" },
      };
      mockedNetwork.mockResolvedValue({
        data: getApiResponseSinceSdk046,
      } as AxiosResponse);

      const cosmosRedelegations = await cosmosApi.getRedelegations("cosmosDelegatorAddress");
      expect(cosmosRedelegations[0].amount).toEqual(new BigNumber(100));
      expect(cosmosRedelegations[0].completionDate).toEqual(
        new Date("2024-04-29T09:38:35.273743543Z"),
      );
      expect(cosmosRedelegations[0].validatorDstAddress).toEqual("cosmosValidatorDstAddress");
      expect(cosmosRedelegations[0].validatorSrcAddress).toEqual("cosmosValidatorSrcAddress");
    });

    it("should return no redelegations if there are none", async () => {
      mockedNetwork.mockResolvedValue({
        data: { redelegation_responses: [], pagination: { next_key: null, total: "0" } },
      } as AxiosResponse);

      const cosmosRedelegations = await cosmosApi.getRedelegations("cosmosDelegatorAddress");
      expect(cosmosRedelegations.length).toEqual(0);
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
        } else if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: {
              application_version: {
                cosmos_sdk_version: "0.44.0",
              },
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
        if (networkOptions.url.includes("recipient") || networkOptions.url.includes("sender")) {
          const pageOffset: string = networkOptions.url
            .split("pagination.offset=")[1]
            .split("&")[0];

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
        } else if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: {
              application_version: {
                cosmos_sdk_version: "0.44.0",
              },
            },
          });
        }
      });
      const txs = await cosmosApi.getTransactions("address", 10);
      // sender + recipient
      expect(txs.length).toEqual(simulatedTotal * 2);
    });
  });

  describe("fetchTransactions", () => {
    const nodeUrl = "nodeURL";
    const sender = "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp";
    const pagination = {
      limit: 100,
      offset: 0,
      reverse: true,
    };
    const mockNetworkTxsResponse = {
      txs: [], // unused
      tx_responses: [
        {
          height: "19827195",
          txhash: "C4D4ED8F0E77DA1BB9CDA148F3500384AE6D2B14E3CBD338B866B79492AD3351",
          codespace: "",
          code: 0,
          data: "12260A242F636F736D6F732E62616E6B2E763162657461312E4D736753656E64526573706F6E7365",
          raw_log: "",
          logs: [],
          info: "",
          gas_wanted: "79806",
          gas_used: "70948",
          tx: {
            "@type": "/cosmos.tx.v1beta1.Tx",
            body: {
              messages: [
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  to_address: "cosmos1qzjgrqjy894jx3luxfamrt2nz4rwx7nl8djyw3",
                  amount: [{ denom: "uatom", amount: "100" }],
                },
              ],
              memo: "",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: [],
            },
            auth_info: {
              signer_infos: [
                {
                  public_key: {
                    "@type": "/cosmos.crypto.secp256k1.PubKey",
                    key: "AnvfR65YxO3gfGPcTY9Qc0EbJdwaqmC7W2oILWHpU+wp",
                  },
                  mode_info: { single: { mode: "SIGN_MODE_LEGACY_AMINO_JSON" } },
                  sequence: "0",
                },
              ],
              fee: {
                amount: [{ denom: "uatom", amount: "1996" }],
                gas_limit: "79806",
                payer: "",
                granter: "",
              },
              tip: null,
            },
            signatures: [
              "uAtttiPzG+VgDFTU1uZQ7Q7ijThbt/mhFegMHXsYvjh4WR9SFZ/iLWdvZrp+nX0LcJuflZ7ZGZwHO9ZH7yKMTg==",
            ],
          },
          timestamp: "2024-04-02T17:03:53Z",
          events: [
            {
              type: "coin_spent",
              attributes: [
                {
                  key: "spender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
                { key: "amount", value: "1996uatom", index: true },
              ],
            },
            {
              type: "coin_received",
              attributes: [
                {
                  key: "receiver",
                  value: "cosmos17xpfvakm2amg962yls6f84z3kell8c5lserqta",
                  index: true,
                },
                { key: "amount", value: "1996uatom", index: true },
              ],
            },
            {
              type: "transfer",
              attributes: [
                {
                  key: "recipient",
                  value: "cosmos17xpfvakm2amg962yls6f84z3kell8c5lserqta",
                  index: true,
                },
                {
                  key: "sender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
                { key: "amount", value: "1996uatom", index: true },
              ],
            },
            {
              type: "message",
              attributes: [
                {
                  key: "sender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
              ],
            },
            {
              type: "tx",
              attributes: [
                { key: "fee", value: "1996uatom", index: true },
                {
                  key: "fee_payer",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
              ],
            },
            {
              type: "tx",
              attributes: [
                {
                  key: "acc_seq",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp/0",
                  index: true,
                },
              ],
            },
            {
              type: "tx",
              attributes: [
                {
                  key: "signature",
                  value:
                    "uAtttiPzG+VgDFTU1uZQ7Q7ijThbt/mhFegMHXsYvjh4WR9SFZ/iLWdvZrp+nX0LcJuflZ7ZGZwHO9ZH7yKMTg==",
                  index: true,
                },
              ],
            },
            {
              type: "message",
              attributes: [
                { key: "action", value: "/cosmos.bank.v1beta1.MsgSend", index: true },
                {
                  key: "sender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
                { key: "module", value: "bank", index: true },
              ],
            },
            {
              type: "coin_spent",
              attributes: [
                {
                  key: "spender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
                { key: "amount", value: "100uatom", index: true },
              ],
            },
            {
              type: "coin_received",
              attributes: [
                {
                  key: "receiver",
                  value: "cosmos1qzjgrqjy894jx3luxfamrt2nz4rwx7nl8djyw3",
                  index: true,
                },
                { key: "amount", value: "100uatom", index: true },
              ],
            },
            {
              type: "transfer",
              attributes: [
                {
                  key: "recipient",
                  value: "cosmos1qzjgrqjy894jx3luxfamrt2nz4rwx7nl8djyw3",
                  index: true,
                },
                {
                  key: "sender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
                { key: "amount", value: "100uatom", index: true },
              ],
            },
            {
              type: "message",
              attributes: [
                {
                  key: "sender",
                  value: "cosmos1mzuuwf9djp25vkcjwc08g3tjsv64d94zj3txfp",
                  index: true,
                },
              ],
            },
          ],
        },
      ],
      pagination: null,
      total: "1",
    };
    const expectedTxs = {
      txs: mockNetworkTxsResponse.tx_responses,
      total: "1",
    };
    it("should fetch a pre v0.47 payload", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }) => {
        if (
          url ===
          `${nodeUrl}/cosmos/tx/v1beta1/txs?events=message.sender='${sender}'&pagination.limit=${pagination.limit}&pagination.offset=${pagination.offset}&pagination.reverse=${pagination.reverse}`
        ) {
          return {
            data: mockNetworkTxsResponse,
          };
        } else if (url.includes("node_info")) {
          return Promise.resolve({
            data: {
              application_version: {
                cosmos_sdk_version: "0.44.0",
              },
            },
          });
        }
      });
      // using as object to access private method
      const result = await cosmosApi["fetchTransactions"](nodeUrl, "message.sender", sender, {
        "pagination.limit": pagination.limit,
        "pagination.offset": pagination.offset,
        "pagination.reverse": pagination.reverse,
      });
      expect(result).toEqual(expectedTxs);
    });
    it("should fetch a v0.50 payload", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }) => {
        if (
          url ===
          `${nodeUrl}/cosmos/tx/v1beta1/txs?query=message.sender='${sender}'&pagination.limit=${pagination.limit}&pagination.offset=${pagination.offset}&pagination.reverse=${pagination.reverse}`
        ) {
          return {
            data: mockNetworkTxsResponse,
          };
        } else if (url.includes("node_info")) {
          return Promise.resolve({
            data: {
              application_version: {
                cosmos_sdk_version: "0.50.0",
              },
            },
          });
        }
      });
      // using as object to access private method
      const result = await cosmosApi["fetchTransactions"](nodeUrl, "message.sender", sender, {
        "pagination.limit": pagination.limit,
        "pagination.offset": pagination.offset,
        "pagination.reverse": pagination.reverse,
      });
      expect(result).toEqual(expectedTxs);
    });
  });

  describe("broadcastTransaction", () => {
    it("should throw a SequenceNumberError exception in case of sequence number error", async () => {
      mockedNetwork.mockResolvedValue({
        data: { tx_response: { code: 32 } },
      } as AxiosResponse);
      await expect(
        cosmosApi.broadcast({
          signedOperation: { operation: {} as Operation, signature: "signedOperation" },
        }),
      ).rejects.toThrow("SequenceNumberError");
    });
  });
});

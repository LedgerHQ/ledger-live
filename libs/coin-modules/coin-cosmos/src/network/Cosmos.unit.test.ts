import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import network from "@ledgerhq/live-network/network";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import cryptoFactory from "../chain/chain";
import cosmosCoinConfig from "../config";
import { cosmosDefaultsFor } from "../test/cosmosDefaults";
import { CosmosAPI } from "./Cosmos";
import { GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE, GET_BLOCK_WITH_TXS_SDK_EXAMPLE } from "./fixtures";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);
const mockAxiosResponse = (data: any) => {
  return mockedNetwork.mockResolvedValue({
    data,
    status: 200,
    headers: {} as any,
    statusText: "",
    config: {
      headers: {} as any,
    },
  });
};

const mockNetwork = (implementation: (options: { url: string }) => Promise<unknown>) =>
  mockedNetwork.mockImplementation(implementation as unknown as typeof network);

const mockNodeAndTxs = (
  sdkVersion: string,
  pages: { txs: { txhash: string }[]; total: number }[],
) => {
  const requestedUrls: string[] = [];
  let served = 0;
  mockNetwork((networkOptions: { url: string }) => {
    if (networkOptions.url.includes("node_info")) {
      return Promise.resolve({
        data: { application_version: { cosmos_sdk_version: sdkVersion } },
      });
    }
    requestedUrls.push(decodeURIComponent(networkOptions.url));
    const page = pages[served++];
    return Promise.resolve({ data: { tx_responses: page.txs, total: page.total } });
  });
  return requestedUrls;
};

const mockBlockPages = (pages: { txCount: number; total: number | null; firstMemo?: string }[]) => {
  const requestedUrls: string[] = [];
  let served = 0;
  mockNetwork((networkOptions: { url: string }) => {
    requestedUrls.push(decodeURIComponent(networkOptions.url));
    const { txCount, total, firstMemo } = pages[served++];
    const [template] = GET_BLOCK_WITH_TXS_SDK_EXAMPLE.txs;
    const txs = Array.from({ length: txCount }, (_, index) => ({
      ...template,
      body: { ...template.body, memo: index === 0 && firstMemo ? firstMemo : template.body.memo },
    }));
    return Promise.resolve({
      data: {
        ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
        txs,
        pagination: total === null ? null : { next_key: null, total: String(total) },
      },
    });
  });
  return requestedUrls;
};

describe("CosmosApi", () => {
  let cosmosApi: CosmosAPI;

  beforeEach(() => {
    cosmosCoinConfig.setCoinConfig(cosmosDefaultsFor);
    cosmosApi = new CosmosAPI("cosmos");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("getAccount", () => {
    it("should return base_account if available", async () => {
      mockedNetwork.mockResolvedValue(
        Promise.resolve({
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
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      const account = await cosmosApi.getAccount("addr");
      expect(account.accountNumber).toEqual(2);
      expect(account.sequence).toEqual(42);
      expect(account.pubKey).toEqual("k2");
      expect(account.pubKeyType).toEqual("type2");
    });

    it("should return the correct account based on type", async () => {
      mockAxiosResponse({
        account: {
          "@type": "/cosmos.auth.v1beta1.BaseAccount",
          account_number: 1,
          sequence: 0,
          pub_key: { key: "k", "@type": "type" },
        },
      });

      const account = await cosmosApi.getAccount("addr");
      expect(account).toEqual({
        accountNumber: 1,
        sequence: 0,
        pubKey: "k",
        pubKeyType: "type",
      });

      mockAxiosResponse({
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
      });

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

  describe("getValidators", () => {
    it("returns validator tokens as a string, preserving uint256 precision", async () => {
      // Value larger than Number.MAX_SAFE_INTEGER — parseFloat would have lost precision here.
      mockAxiosResponse({
        validators: [
          {
            operator_address: "cosmosvaloper1abc",
            description: { moniker: "Big Validator" },
            tokens: "123456789012345678901234567890",
            commission: { commission_rates: { rate: "0.05" } },
          },
        ],
      });

      const [validator] = await cosmosApi.getValidators();

      expect(validator).toEqual({
        validatorAddress: "cosmosvaloper1abc",
        name: "Big Validator",
        tokens: "123456789012345678901234567890",
        votingPower: 0,
        commission: 0.05,
        estimatedYearlyRewardsRate: 0,
      });
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
      mockAxiosResponse(getApiResponseSinceSdk041);
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

      mockAxiosResponse(getApiResponseSinceSdk046);

      const cosmosRedelegations = await cosmosApi.getRedelegations("cosmosDelegatorAddress");
      expect(cosmosRedelegations[0].amount).toEqual(new BigNumber(100));
      expect(cosmosRedelegations[0].completionDate).toEqual(
        new Date("2024-04-29T09:38:35.273743543Z"),
      );
      expect(cosmosRedelegations[0].validatorDstAddress).toEqual("cosmosValidatorDstAddress");
      expect(cosmosRedelegations[0].validatorSrcAddress).toEqual("cosmosValidatorSrcAddress");
    });

    it("should return no redelegations if there are none", async () => {
      mockAxiosResponse({ redelegation_responses: [], pagination: { next_key: null, total: "0" } });

      const cosmosRedelegations = await cosmosApi.getRedelegations("cosmosDelegatorAddress");
      expect(cosmosRedelegations.length).toEqual(0);
    });
  });

  describe("simulate", () => {
    it("should return gas used when the network call returns gas used", async () => {
      mockAxiosResponse({
        gas_info: {
          gas_used: 42000,
        },
      });
      const gas = await cosmosApi.simulate([]);
      expect(gas).toEqual(new BigNumber(42000));
    });

    it("should throw an error when the network call does not return gas used", async () => {
      mockAxiosResponse({
        gas_info: {},
      });

      await expect(cosmosApi.simulate([])).rejects.toThrow();
    });

    it("should throw an error when the network call fails", async () => {
      mockedNetwork.mockImplementation(() => {
        throw new Error();
      });
      await expect(cosmosApi.simulate([])).rejects.toThrow();
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
      expect(txs).toEqual([{ txhash: "senderhash" }, { txhash: "recipienthash" }]);
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

    // Both messages are real, captured from cosmoshub/injective mainnet LCDs.
    it.each([
      [
        "a page past the last",
        "failed to search for txs: page should be within [1, 1] range, given 2",
      ],
      [
        "a tx the node cannot decode",
        "unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error",
      ],
    ])("keeps the pages already fetched when %s fails", async (_label, message) => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.50.1" } },
          });
        }
        if (networkOptions.url.includes("page=1")) {
          return Promise.resolve({
            data: {
              total: "50",
              tx_responses: [{ txhash: "a" }, { txhash: "b" }, { txhash: "c" }],
            },
          });
        }
        return Promise.reject(new Error(message));
      });

      const txs = await cosmosApi.getTransactions("address", 10);

      // kept, not dropped to []
      expect(txs.length).toEqual(6);
    });

    it("does not stop early when the node caps the page size below the requested limit", async () => {
      // CometBFT clamps per_page to 100, so asking for 150 yields short-but-not-last pages.
      const simulatedTotal = 250;
      const serverCap = 100;
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.50.1" } },
          });
        }
        const page = Number(networkOptions.url.split("page=")[1].split("&")[0]);
        const served = Math.max(0, Math.min(serverCap, simulatedTotal - (page - 1) * serverCap));
        return Promise.resolve({
          data: {
            total: String(simulatedTotal),
            tx_responses: Array.from({ length: served }, (_, i) => ({ txhash: `${page}_${i}` })),
          },
        });
      });

      const txs = await cosmosApi.getTransactions("address", 150);

      // sender + recipient, not truncated at the first short page
      expect(txs.length).toEqual(simulatedTotal * 2);
    });

    it("stops instead of looping forever when a node serves an empty page under its own total", async () => {
      // `total` is the index's count; a node can serve fewer than it counts and answer 200 with
      // `tx_responses: null` rather than 500. The loop only advances on txs, so no progress here
      // means it never reaches `total`. The cap below stands in for "forever".
      const callCap = 20;
      let pageFetches = 0;
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.50.1" } },
          });
        }
        pageFetches += 1;
        if (pageFetches > callCap) return Promise.reject(new Error("looped past the cap"));
        const page = Number(networkOptions.url.split("page=")[1].split("&")[0]);
        return Promise.resolve({
          data: {
            total: "50",
            tx_responses: page === 1 ? [{ txhash: "a" }, { txhash: "b" }] : null,
          },
        });
      });

      const txs = await cosmosApi.getTransactions("address", 100);

      // one full page + one empty page, per stream
      expect(pageFetches).toEqual(4);
      expect(txs).toEqual([{ txhash: "a" }, { txhash: "b" }, { txhash: "a" }, { txhash: "b" }]);
    });
  });

  describe("getTransactionsPage", () => {
    it("fetches one bounded page per stream and reports hasMore=true", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.44.0" } },
          });
        }
        const limit = Number(networkOptions.url.split("pagination.limit=")[1].split("&")[0]);
        return Promise.resolve({
          data: {
            pagination: { total: 500 },
            tx_responses: Array(limit)
              .fill({})
              .map((_, i) => ({ txhash: `h${i}` })),
          },
        });
      });

      const { streams } = await cosmosApi.getTransactionsPage("address", 10);
      expect(streams.map(stream => stream.txs.length)).toEqual([10, 10, 10]);
      expect(streams.map(stream => stream.hasMore)).toEqual([true, true, true]);
    });

    it("queries the sender, recipient and fee payer streams", async () => {
      const requestedUrls: string[] = [];
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.44.0" } },
          });
        }
        requestedUrls.push(decodeURIComponent(networkOptions.url));
        return Promise.resolve({ data: { pagination: { total: 0 }, tx_responses: [] } });
      });

      await cosmosApi.getTransactionsPage("address", 10);

      expect(requestedUrls).toEqual([
        expect.stringContaining("message.sender='address'"),
        expect.stringContaining("transfer.recipient='address'"),
        expect.stringContaining("tx.fee_payer='address'"),
      ]);
    });

    it("reports hasMore per stream when only the fee payer stream exceeds count", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.44.0" } },
          });
        }
        const total = decodeURIComponent(networkOptions.url).includes("tx.fee_payer") ? 500 : 2;
        return Promise.resolve({ data: { pagination: { total }, tx_responses: [] } });
      });

      const { streams } = await cosmosApi.getTransactionsPage("address", 10);

      expect(streams.map(stream => stream.hasMore)).toEqual([false, false, true]);
    });

    it("reports hasMore=false when all streams fit within count", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.44.0" } },
          });
        }
        return Promise.resolve({
          data: { pagination: { total: 2 }, tx_responses: [{ txhash: "a" }, { txhash: "b" }] },
        });
      });

      const { streams } = await cosmosApi.getTransactionsPage("address", 10);
      expect(streams.map(stream => stream.txs.length)).toEqual([2, 2, 2]);
      expect(streams.map(stream => stream.hasMore)).toEqual([false, false, false]);
    });

    it("falls back to legacy params when the node version is unparseable", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "unknown" } },
          });
        }
        // Only the legacy path carries pagination.limit; if modern params were chosen this throws.
        const limit = Number(networkOptions.url.split("pagination.limit=")[1].split("&")[0]);
        return Promise.resolve({
          data: {
            pagination: { total: 2 },
            tx_responses: Array(limit)
              .fill({})
              .map((_, i) => ({ txhash: `h${i}` })),
          },
        });
      });

      // Old behaviour: semver.gte throws on "unknown" → catch → empty page. Fixed: legacy params.
      const { streams } = await cosmosApi.getTransactionsPage("address", 5);
      expect(streams.map(stream => stream.txs.length)).toEqual([5, 5, 5]);
    });
  });

  describe("fetchTransactions", () => {
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
      // the wire payload carries "1" as a string; fetchTransactions normalizes it
      total: 1,
    };
    it("should fetch a pre v0.47 payload", async () => {
      const params = new URLSearchParams({
        events: `message.sender='${sender}'`,
        "pagination.limit": String(pagination.limit),
        "pagination.offset": String(pagination.offset),
        "pagination.reverse": String(pagination.reverse),
      });
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }) => {
        if (url === `${cosmosApi["defaultEndpoint"]}/cosmos/tx/v1beta1/txs?${params.toString()}`) {
          return { data: mockNetworkTxsResponse };
        }
      });
      // using as object to access private method
      const result = await cosmosApi["fetchTransactions"](params);
      expect(result).toEqual(expectedTxs);
    });
    it("should fetch a v0.50 payload", async () => {
      const params = new URLSearchParams({
        query: `message.sender='${sender}'`,
        page: "1",
        limit: String(pagination.limit),
        order_by: "ORDER_BY_DESC",
      });
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }) => {
        if (url === `${cosmosApi["defaultEndpoint"]}/cosmos/tx/v1beta1/txs?${params.toString()}`) {
          return { data: mockNetworkTxsResponse };
        }
      });
      // using as object to access private method
      const result = await cosmosApi["fetchTransactions"](params);
      expect(result).toEqual(expectedTxs);
    });
    it("normalizes a null tx_responses to an empty array", async () => {
      // An empty history comes back as `tx_responses: null`; unguarded, `concat(null)` would
      // push a literal null into the tx list.
      // @ts-expect-error method is mocked
      network.mockResolvedValue({ data: { tx_responses: null, pagination: null, total: "0" } });

      const result = await cosmosApi["fetchTransactions"](new URLSearchParams());

      expect(result).toEqual({ txs: [], total: 0 });
    });
  });

  describe("broadcastTransaction", () => {
    it("should throw a SequenceNumberError exception in case of sequence number error", async () => {
      mockAxiosResponse({ tx_response: { code: 32 } });
      await expect(
        cosmosApi.broadcast({
          signedOperation: { operation: {} as Operation, signature: "signedOperation" },
        }),
      ).rejects.toThrow("SequenceNumberError");
    });
  });

  describe("getAccountInfo", () => {
    const babylonAddress = "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n";
    const babylonDenom = "ubbn";

    const queuedDelegate = {
      msg_type: "cosmos.staking.v1beta1.MsgDelegate",
      msg: `delegator_address:"${babylonAddress}" validator_address:"bbnvaloper1pending" amount:<denom:"ubbn" amount:"30" >`,
    };
    const queuedUndelegate = {
      msg_type: "cosmos.staking.v1beta1.MsgUndelegate",
      msg: `delegator_address:"${babylonAddress}" validator_address:"bbnvaloper1active" amount:<denom:"ubbn" amount:"10" >`,
    };
    const queuedForeignDelegate = {
      msg_type: "cosmos.staking.v1beta1.MsgDelegate",
      msg: `delegator_address:"bbn1someoneelse" validator_address:"bbnvaloper1pending" amount:<denom:"ubbn" amount:"99" >`,
    };
    const processedUnbonding = {
      validator_address: "bbnvaloper1active",
      entries: [
        {
          initial_balance: "500000",
          completion_time: "2026-08-10T07:10:27.684611546Z",
          creation_height: "4016160",
        },
      ],
    };

    const mockAccountInfoRoutes = (opts: {
      height?: number;
      epochs?: string[];
      epochBoundary?: string;
      msgs?: { msg: string; msg_type: string }[];
      epochingError?: boolean;
      unbondings?: {
        validator_address: string;
        entries: { initial_balance: string; completion_time: string; creation_height?: string }[];
      }[];
    }) => {
      const {
        height = 100,
        epochs = ["5"],
        epochBoundary = "360",
        msgs = [],
        epochingError = false,
        unbondings = [],
      } = opts;
      let currentEpochCalls = 0;
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }: { url: string }) => {
        const respond = (data: unknown) => Promise.resolve({ data });
        if (url.includes("/babylon/epoching/v1/")) {
          if (epochingError) {
            return Promise.reject(new Error("epoching unavailable"));
          }
          if (url.includes("current_epoch")) {
            const epoch = epochs[Math.min(currentEpochCalls, epochs.length - 1)];
            currentEpochCalls += 1;
            return respond({ current_epoch: epoch, epoch_boundary: epochBoundary });
          }
          return respond({ msgs, pagination: { next_key: null, total: String(msgs.length) } });
        }
        if (url.includes("node_info")) {
          return respond({ application_version: { cosmos_sdk_version: "0.50.0" } });
        }
        if (url.includes("blocks/latest")) {
          return respond({ block: { header: { height: String(height) } } });
        }
        if (url.includes("/auth/")) {
          return respond({
            account: {
              "@type": "/cosmos.auth.v1beta1.BaseAccount",
              account_number: "1",
              sequence: "1",
            },
          });
        }
        if (url.includes("/bank/")) {
          return respond({ balances: [{ denom: "ubbn", amount: "70" }] });
        }
        if (url.includes("/tx/v1beta1/txs")) {
          return respond({ tx_responses: [], total: "0" });
        }
        if (url.includes("/redelegations")) {
          return respond({ redelegation_responses: [] });
        }
        if (url.includes("/unbonding_delegations")) {
          return respond({ unbonding_responses: unbondings });
        }
        if (url.includes("/withdraw_address")) {
          return respond({ withdraw_address: babylonAddress });
        }
        if (url.includes("/rewards")) {
          return respond({ rewards: [] });
        }
        if (url.includes("/staking/v1beta1/delegations/")) {
          return respond({
            delegation_responses: [
              {
                delegation: { validator_address: "bbnvaloper1active" },
                balance: { denom: "ubbn", amount: "50" },
              },
            ],
          });
        }
        if (url.includes("/staking/v1beta1/validators/")) {
          return respond({ validator: { status: "BOND_STATUS_BONDED" } });
        }
        return Promise.reject(new Error(`unmocked url: ${url}`));
      });
    };

    it("merges queued epoching staking messages into babylon positions", async () => {
      mockAccountInfoRoutes({ msgs: [queuedDelegate, queuedUndelegate, queuedForeignDelegate] });
      const babylonApi = new CosmosAPI("babylon");
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);

      expect(result.delegations).toEqual([
        expect.objectContaining({
          validatorAddress: "bbnvaloper1active",
          amount: new BigNumber(40),
        }),
        expect.objectContaining({
          validatorAddress: "bbnvaloper1pending",
          amount: new BigNumber(30),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        }),
      ]);
      expect(result.unbondings).toEqual([
        expect.objectContaining({
          validatorAddress: "bbnvaloper1active",
          amount: new BigNumber(10),
        }),
      ]);
      // enrichment only — the bank balance must be untouched (guards against double-counting)
      expect(result.balances).toEqual(new BigNumber(70));
    });

    it("does not merge when the epoch changes during the queue fetch", async () => {
      mockAccountInfoRoutes({ epochs: ["5", "6"], msgs: [queuedDelegate] });
      const babylonApi = new CosmosAPI("babylon");
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);

      expect(result.delegations).toEqual([
        expect.objectContaining({
          validatorAddress: "bbnvaloper1active",
          amount: new BigNumber(50),
        }),
      ]);
      expect(result.unbondings).toEqual([]);
    });

    it("does not merge when the block height is past the epoch boundary", async () => {
      mockAccountInfoRoutes({ height: 999, epochBoundary: "360", msgs: [queuedDelegate] });
      const babylonApi = new CosmosAPI("babylon");
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);

      expect(result.delegations).toEqual([expect.objectContaining({ amount: new BigNumber(50) })]);
    });

    it("does not merge when the block height equals the epoch boundary", async () => {
      // at the boundary block the queue has already executed into the on-chain delegations
      mockAccountInfoRoutes({ height: 360, epochBoundary: "360", msgs: [queuedDelegate] });
      const babylonApi = new CosmosAPI("babylon");
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);

      expect(result.delegations).toEqual([expect.objectContaining({ amount: new BigNumber(50) })]);
    });

    it("keeps the babylon sync alive when the epoching endpoint fails", async () => {
      mockAccountInfoRoutes({ epochingError: true, msgs: [queuedDelegate] });
      const babylonApi = new CosmosAPI("babylon");
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);

      expect(result.balances).toEqual(new BigNumber(70));
      expect(result.delegations).toEqual([expect.objectContaining({ amount: new BigNumber(50) })]);
    });

    it("never requests epoching endpoints for non-epoched chains", async () => {
      mockAccountInfoRoutes({});
      await cosmosApi.getAccountInfo("cosmos1myaddress", "uatom");

      const requestedUrls = mockedNetwork.mock.calls.map(([options]) => options.url);
      expect(requestedUrls.length).toBeGreaterThan(0);
      expect(requestedUrls.some(url => url?.includes("epoching"))).toBe(false);
    });

    it("re-anchors a processed babylon unbonding to the fast-unbonding period, not the chain's 21-day completion_time", async () => {
      const height = 4_016_182; // 22 blocks past the unbonding's creation_height (4016160)
      mockAccountInfoRoutes({ height, unbondings: [processedUnbonding] });
      const babylonApi = new CosmosAPI("babylon");

      const before = Date.now();
      const result = await babylonApi.getAccountInfo(babylonAddress, babylonDenom);
      const after = Date.now();

      const DAY_MS = 86_400_000;
      const offsetMs = 2 * DAY_MS - (height - 4_016_160) * 10_000;
      const [unbonding] = result.unbondings;
      expect(unbonding.completionDate.getTime()).toBeGreaterThanOrEqual(before + offsetMs);
      expect(unbonding.completionDate.getTime()).toBeLessThanOrEqual(after + offsetMs);
      // definitely not the raw ~21-day chain value
      expect(unbonding.completionDate.toISOString()).not.toBe("2026-08-10T07:10:27.684Z");
    });

    it("keeps the chain completion_time on non-epoched chains (no re-anchor)", async () => {
      mockAccountInfoRoutes({ unbondings: [processedUnbonding] });

      const result = await cosmosApi.getAccountInfo("cosmos1myaddress", "uatom");

      expect(result.unbondings).toEqual([
        expect.objectContaining({
          validatorAddress: "bbnvaloper1active",
          completionDate: new Date("2026-08-10T07:10:27.684611546Z"),
        }),
      ]);
    });

    it("skips the re-anchor and keeps completion_time when creation_height is missing/non-numeric", async () => {
      const malformed = {
        validator_address: "bbnvaloper1active",
        entries: [{ initial_balance: "500000", completion_time: "2026-08-10T07:10:27.684611546Z" }],
      };
      mockAccountInfoRoutes({ height: 4_016_182, unbondings: [malformed] });
      const babylonApi = new CosmosAPI("babylon");

      const [unbonding] = (await babylonApi.getAccountInfo(babylonAddress, babylonDenom))
        .unbondings;
      expect(unbonding.completionDate).toEqual(new Date("2026-08-10T07:10:27.684611546Z"));
      expect(Number.isNaN(unbonding.completionDate.getTime())).toBe(false);
    });
  });

  const BABYLON_ADDRESS = "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n";

  // height 100 < epoch boundary 360, so the caller's queued messages merge.
  const mockBabylonRoutes = (msgs: { msg_type: string; msg: string }[]) => {
    // @ts-expect-error method is mocked
    network.mockImplementation(({ url }: { url: string }) => {
      const respond = (data: unknown) => Promise.resolve({ data });
      if (url.includes("current_epoch"))
        return respond({ current_epoch: "5", epoch_boundary: "360" });
      if (url.includes("/babylon/epoching/v1/"))
        return respond({ msgs, pagination: { next_key: null, total: String(msgs.length) } });
      if (url.includes("blocks/latest")) return respond({ block: { header: { height: "100" } } });
      if (url.includes("/redelegations")) return respond({ redelegation_responses: [] });
      if (url.includes("/unbonding_delegations")) return respond({ unbonding_responses: [] });
      if (url.includes("/rewards")) return respond({ rewards: [] });
      if (url.includes("/staking/v1beta1/delegations/"))
        return respond({
          delegation_responses: [
            {
              delegation: { validator_address: "bbnvaloper1active" },
              balance: { denom: "ubbn", amount: "50" },
            },
          ],
        });
      if (url.includes("/staking/v1beta1/validators/"))
        return respond({ validator: { status: "BOND_STATUS_BONDED" } });
      return Promise.reject(new Error(`unmocked url: ${url}`));
    });
  };

  describe("getStakingPositions", () => {
    const denom = "ubbn";

    it("returns delegations/unbondings with queued epoching messages merged (babylon)", async () => {
      mockBabylonRoutes([
        {
          msg_type: "cosmos.staking.v1beta1.MsgDelegate",
          msg: `delegator_address:"${BABYLON_ADDRESS}" validator_address:"bbnvaloper1pending" amount:<denom:"ubbn" amount:"30" >`,
        },
      ]);

      const babylonApi = new CosmosAPI("babylon");
      const { delegations, unbondings } = await babylonApi.getStakingPositions(
        BABYLON_ADDRESS,
        denom,
      );

      expect(unbondings).toEqual([]);
      expect(delegations).toEqual([
        expect.objectContaining({
          validatorAddress: "bbnvaloper1active",
          amount: new BigNumber(50),
        }),
        expect.objectContaining({
          validatorAddress: "bbnvaloper1pending",
          amount: new BigNumber(30),
        }),
      ]);
    });
  });

  describe("block queries", () => {
    it("getLatestBlockInfo maps the latest block", async () => {
      mockAxiosResponse(GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE);

      await expect(cosmosApi.getLatestBlockInfo()).resolves.toEqual({
        height: 33721700,
        hash: GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE.block_id.hash,
        time: new Date("2026-11-04T10:24:57.711662460Z"),
      });
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/cosmos\/base\/tendermint\/v1beta1\/blocks\/latest$/),
        }),
      );
    });

    it("getBlockInfo queries the block at the given height and maps it", async () => {
      mockAxiosResponse(GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE);

      await expect(cosmosApi.getBlockInfo(33721700)).resolves.toEqual({
        height: 33721700,
        hash: GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE.block_id.hash,
        time: new Date("2026-11-04T10:24:57.711662460Z"),
      });
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/cosmos\/base\/tendermint\/v1beta1\/blocks\/33721700$/),
        }),
      );
    });

    it("getBlockWithTxs queries the block with its transactions at the given height", async () => {
      const requestedUrls = mockBlockPages([{ txCount: 1, total: 1 }]);

      await expect(cosmosApi.getBlockWithTxs(33721701, 100)).resolves.toEqual(
        GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
      );
      expect(requestedUrls).toEqual([
        expect.stringMatching(
          /\/cosmos\/tx\/v1beta1\/txs\/block\/33721701\?pagination\.limit=100&pagination\.offset=0$/,
        ),
      ]);
    });

    it("getBlockWithTxs concatenates every page of decoded transactions in block order", async () => {
      const requestedUrls = mockBlockPages([
        { txCount: 100, total: 250, firstMemo: "page-1" },
        { txCount: 100, total: 250, firstMemo: "page-2" },
        { txCount: 50, total: 250, firstMemo: "page-3" },
      ]);

      const block = await cosmosApi.getBlockWithTxs(33721701, 100);

      expect(block.txs).toHaveLength(250);
      expect([0, 100, 200].map(index => block.txs[index].body.memo)).toEqual([
        "page-1",
        "page-2",
        "page-3",
      ]);
      expect(block.block_id).toEqual(GET_BLOCK_WITH_TXS_SDK_EXAMPLE.block_id);
      expect(requestedUrls).toEqual([
        expect.stringContaining("pagination.limit=100&pagination.offset=0"),
        expect.stringContaining("pagination.limit=100&pagination.offset=100"),
        expect.stringContaining("pagination.limit=100&pagination.offset=200"),
      ]);
    });

    it("getBlockWithTxs pages by the given limit", async () => {
      const requestedUrls = mockBlockPages([
        { txCount: 50, total: 120 },
        { txCount: 50, total: 120 },
        { txCount: 20, total: 120 },
      ]);

      const block = await cosmosApi.getBlockWithTxs(33721701, 50);

      expect(block.txs).toHaveLength(120);
      expect(requestedUrls).toEqual([
        expect.stringContaining("pagination.limit=50&pagination.offset=0"),
        expect.stringContaining("pagination.limit=50&pagination.offset=50"),
        expect.stringContaining("pagination.limit=50&pagination.offset=100"),
      ]);
    });

    it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
      "getBlockWithTxs rejects the invalid limit %p without requesting",
      async limit => {
        await expect(cosmosApi.getBlockWithTxs(33721701, limit)).rejects.toMatchObject({
          name: "InvalidParameterError",
          message: `Invalid pagination limit: ${limit}`,
        });
        await expect(cosmosApi.getBlockWithTxs(33721701, limit)).rejects.toBeInstanceOf(
          InvalidParameterError,
        );
        expect(mockedNetwork).not.toHaveBeenCalled();
      },
    );

    it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
      "getTransactionsByHeight rejects the invalid limit %p without requesting",
      async limit => {
        await expect(cosmosApi.getTransactionsByHeight(33721701, limit)).rejects.toMatchObject({
          name: "InvalidParameterError",
          message: `Invalid pagination limit: ${limit}`,
        });
        expect(mockedNetwork).not.toHaveBeenCalled();
      },
    );

    it("getTransactionsByHeight pages by the given limit with page params", async () => {
      const requestedUrls = mockNodeAndTxs("0.53.0", [
        { txs: [{ txhash: "A" }, { txhash: "B" }], total: 3 },
        { txs: [{ txhash: "C" }], total: 3 },
      ]);

      await cosmosApi.getTransactionsByHeight(33721701, 2);

      expect(requestedUrls).toEqual([
        expect.stringContaining("query=tx.height=33721701&page=1&limit=2"),
        expect.stringContaining("query=tx.height=33721701&page=2&limit=2"),
      ]);
    });

    it("getTransactionsByHeight pages by the given limit with legacy offsets", async () => {
      const requestedUrls = mockNodeAndTxs("0.45.16", [
        { txs: [{ txhash: "A" }, { txhash: "B" }], total: 3 },
        { txs: [{ txhash: "C" }], total: 3 },
      ]);

      await cosmosApi.getTransactionsByHeight(33721701, 2);

      expect(requestedUrls).toEqual([
        expect.stringContaining("events=tx.height=33721701&pagination.limit=2&pagination.offset=0"),
        expect.stringContaining("events=tx.height=33721701&pagination.limit=2&pagination.offset=2"),
      ]);
    });

    it("getBlockWithTxs does not request a page past the total", async () => {
      const requestedUrls = mockBlockPages([
        { txCount: 100, total: 100 },
        { txCount: 0, total: 100 },
      ]);

      const block = await cosmosApi.getBlockWithTxs(33721701, 100);

      expect(block.txs).toHaveLength(100);
      expect(requestedUrls).toHaveLength(1);
    });

    it("getBlockWithTxs keeps a block without transactions", async () => {
      const requestedUrls = mockBlockPages([{ txCount: 0, total: 0 }]);

      await expect(cosmosApi.getBlockWithTxs(33721701, 100)).resolves.toEqual(
        expect.objectContaining({ txs: [] }),
      );
      expect(requestedUrls).toHaveLength(1);
    });

    it("getBlockWithTxs reads the decoded transactions as the only page when pagination is null", async () => {
      const requestedUrls = mockBlockPages([{ txCount: 2, total: null }]);

      const block = await cosmosApi.getBlockWithTxs(33721701, 100);

      expect(block.txs).toHaveLength(2);
      expect(requestedUrls).toHaveLength(1);
    });

    it("getBlockWithTxs rejects when a page cannot be fetched", async () => {
      const failure = new NetworkDown("lcd unreachable");
      let served = 0;
      mockNetwork(() => {
        served += 1;
        return served === 1
          ? Promise.resolve({
              data: {
                ...GET_BLOCK_WITH_TXS_SDK_EXAMPLE,
                txs: Array.from({ length: 100 }, () => GET_BLOCK_WITH_TXS_SDK_EXAMPLE.txs[0]),
                pagination: { next_key: null, total: "150" },
              },
            })
          : Promise.reject(failure);
      });

      await expect(cosmosApi.getBlockWithTxs(33721701, 100)).rejects.toBe(failure);
    });

    it("getTransactionsByHeight pages with the modern params from cosmos-sdk 0.50", async () => {
      const requestedUrls = mockNodeAndTxs("0.53.0", [
        { txs: [{ txhash: "A" }, { txhash: "B" }], total: 3 },
        { txs: [{ txhash: "C" }], total: 3 },
      ]);

      const txs = await cosmosApi.getTransactionsByHeight(33721701, 100);

      expect(txs.map(tx => tx.txhash)).toEqual(["A", "B", "C"]);
      expect(requestedUrls).toEqual([
        expect.stringContaining("query=tx.height=33721701&page=1&limit=100"),
        expect.stringContaining("query=tx.height=33721701&page=2&limit=100"),
      ]);
    });

    it.each(["0.46.0", "0.47.14"])(
      "getTransactionsByHeight pages with events and page/limit on cosmos-sdk %s",
      async sdkVersion => {
        const requestedUrls = mockNodeAndTxs(sdkVersion, [
          { txs: [{ txhash: "A" }, { txhash: "B" }], total: 3 },
          { txs: [{ txhash: "C" }], total: 3 },
        ]);

        const txs = await cosmosApi.getTransactionsByHeight(33721701, 100);

        expect(txs.map(tx => tx.txhash)).toEqual(["A", "B", "C"]);
        expect(requestedUrls).toEqual([
          expect.stringContaining("events=tx.height=33721701&page=1&limit=100"),
          expect.stringContaining("events=tx.height=33721701&page=2&limit=100"),
        ]);
        expect(requestedUrls.join()).not.toContain("pagination.");
      },
    );

    it("getTransactionsByHeight pages with query and page/limit from cosmos-sdk 0.50.0", async () => {
      const requestedUrls = mockNodeAndTxs("0.50.0", [
        { txs: [{ txhash: "A" }], total: 2 },
        { txs: [{ txhash: "B" }], total: 2 },
      ]);

      await cosmosApi.getTransactionsByHeight(33721701, 100);

      expect(requestedUrls).toEqual([
        expect.stringContaining("query=tx.height=33721701&page=1&limit=100"),
        expect.stringContaining("query=tx.height=33721701&page=2&limit=100"),
      ]);
    });

    it("getTransactionsByHeight pages with events and pagination before cosmos-sdk 0.46", async () => {
      const requestedUrls = mockNodeAndTxs("0.45.16", [
        { txs: [{ txhash: "A" }], total: 2 },
        { txs: [{ txhash: "B" }], total: 2 },
      ]);

      await cosmosApi.getTransactionsByHeight(33721701, 100);

      expect(requestedUrls).toEqual([
        expect.stringContaining(
          "events=tx.height=33721701&pagination.limit=100&pagination.offset=0",
        ),
        expect.stringContaining(
          "events=tx.height=33721701&pagination.limit=100&pagination.offset=100",
        ),
      ]);
    });

    it("getTransactionsByHeight falls back to events and pagination when the node version is unparseable", async () => {
      const requestedUrls = mockNodeAndTxs("unknown", [{ txs: [{ txhash: "A" }], total: 1 }]);

      await cosmosApi.getTransactionsByHeight(33721701, 100);

      expect(requestedUrls).toEqual([
        expect.stringContaining(
          "events=tx.height=33721701&pagination.limit=100&pagination.offset=0",
        ),
      ]);
    });

    it("getTransactionsByHeight stops on an empty page even if total is larger", async () => {
      const requestedUrls = mockNodeAndTxs("0.53.0", [{ txs: [], total: 5 }]);

      await expect(cosmosApi.getTransactionsByHeight(33721701, 100)).resolves.toEqual([]);
      expect(requestedUrls).toHaveLength(1);
    });

    it("getTransactionsByHeight rejects when a page cannot be fetched", async () => {
      const failure = new NetworkDown("lcd unreachable");
      mockNetwork((networkOptions: { url: string }) => {
        if (networkOptions.url.includes("node_info")) {
          return Promise.resolve({
            data: { application_version: { cosmos_sdk_version: "0.53.0" } },
          });
        }
        return Promise.reject(failure);
      });

      await expect(cosmosApi.getTransactionsByHeight(33721701, 100)).rejects.toBe(failure);
    });
  });

  describe("getRedelegationsWithQueued", () => {
    const babylon = "ubbn";
    const cosmos = "uatom";

    it("merges queued redelegations on epoched chains (babylon)", async () => {
      mockBabylonRoutes([
        {
          msg_type: "cosmos.staking.v1beta1.MsgBeginRedelegate",
          msg: `delegator_address:"${BABYLON_ADDRESS}" validator_src_address:"bbnvaloper1active" validator_dst_address:"bbnvaloper1pending" amount:<denom:"ubbn" amount:"20" >`,
        },
      ]);

      const babylonApi = new CosmosAPI("babylon");
      const redelegations = await babylonApi.getRedelegationsWithQueued(BABYLON_ADDRESS, babylon);

      expect(redelegations).toEqual([
        expect.objectContaining({
          validatorSrcAddress: "bbnvaloper1active",
          validatorDstAddress: "bbnvaloper1pending",
          amount: new BigNumber(20),
        }),
      ]);
    });

    it("returns only executed redelegations and skips epoching/delegations on non-epoched chains (cosmos)", async () => {
      // @ts-expect-error method is mocked
      network.mockImplementation(({ url }: { url: string }) => {
        const respond = (data: unknown) => Promise.resolve({ data });
        if (url.includes("/redelegations"))
          return respond({
            redelegation_responses: [
              {
                redelegation: {
                  validator_src_address: "cosmosvaloper1src",
                  validator_dst_address: "cosmosvaloper1dst",
                },
                entries: [
                  {
                    redelegation_entry: {
                      initial_balance: "1000000",
                      completion_time: "2026-01-01T00:00:00Z",
                    },
                  },
                ],
              },
            ],
          });
        return Promise.reject(new Error(`unmocked url: ${url}`));
      });

      const redelegations = await cosmosApi.getRedelegationsWithQueued("cosmos1a", cosmos);

      expect(redelegations).toEqual([
        expect.objectContaining({
          validatorSrcAddress: "cosmosvaloper1src",
          validatorDstAddress: "cosmosvaloper1dst",
          amount: new BigNumber("1000000"),
        }),
      ]);
      const urls = mockedNetwork.mock.calls.map(([o]) => o.url);
      expect(urls.some(u => u?.includes("epoching"))).toBe(false);
      expect(urls.some(u => u?.includes("/staking/v1beta1/delegations/"))).toBe(false);
    });
  });
});

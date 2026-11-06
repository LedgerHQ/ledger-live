import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosCoinConfig, CosmosContext } from "../config";
import { CosmosAPI } from "../network/Cosmos";

jest.mock("../network/Cosmos", () => ({
  CosmosAPI: jest.fn().mockImplementation(() => ({
    getAllBalances: jest.fn().mockResolvedValue({ toFixed: () => "0" }),
    getAccount: jest
      .fn()
      .mockResolvedValue({ accountNumber: 0, sequence: 0, pubKeyType: "", pubKey: "" }),
    getLatestBlockInfo: jest.fn().mockResolvedValue({ height: 1, hash: "hash", time: new Date() }),
    getBlockInfo: jest.fn().mockResolvedValue({ height: 7, hash: "hash7", time: new Date(0) }),
    getBlockWithTxs: jest.fn().mockResolvedValue({
      block_id: { hash: "hash7" },
      block: { header: { height: "7", time: "1970-01-01T00:00:00Z" }, data: { txs: [] } },
      txs: [],
    }),
    getTransactionsByHeight: jest.fn().mockResolvedValue([]),
    getTransactionsPage: jest.fn().mockResolvedValue({ streams: [] }),
    getValidators: jest.fn().mockResolvedValue([]),
    getDelegations: jest.fn().mockResolvedValue([]),
    getUnbondings: jest.fn().mockResolvedValue([]),
    getStakingPositions: jest.fn().mockResolvedValue({ delegations: [], unbondings: [] }),
    broadcastRawTransaction: jest.fn().mockResolvedValue("HASH"),
  })),
}));

import { createApi } from "./index";

const config = {
  status: { type: "active" },
  denom: "uatom",
  getBlock: { pagination: { limit: 100 } },
} as unknown as CosmosCoinConfig;

const makeContext = (cfg: CosmosCoinConfig = config): CosmosContext => ({
  config: async () => cfg,
  logger: () => {},
});

const context = makeContext();

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("api/createApi", () => {
  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi("cosmos"), context)).resolves.toEqual({
      unsupported: ["call", "craftRawTransaction", "getRewards", "register"],
      inconsistent: [],
    });
  });
  it("declares every method the chain supports", () => {
    const api = createApi("cosmos") as unknown as Record<string, unknown>;

    const methods = [
      "getBalance",
      "getNextSequence",
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "validateAddress",
      "broadcast",
      "craftTransaction",
      "combine",
      "estimateFees",
      "validateIntent",
      "listOperations",
      "getStakes",
      "getValidators",
      "craftTransactionData",
    ];
    for (const m of methods) {
      expect(typeof api[m]).toBe("function");
    }
  });

  it("wires the supported delegations to the logic layer", async () => {
    const api = createApi("cosmos");

    await expect(api.getBalance(context, "cosmos1a")).resolves.toEqual([
      { value: 0n, asset: { type: "native" }, locked: 0n },
    ]);
    await expect(api.getNextSequence(context, "cosmos1a")).resolves.toBe(0n);
    await expect(api.lastBlock(context)).resolves.toHaveProperty("height", 1);
    await expect(api.getBlockInfo(context, 7)).resolves.toHaveProperty("hash", "hash7");
    await expect(api.getBlock(context, 7)).resolves.toEqual({
      info: { height: 7, hash: "hash7", time: new Date(0) },
      transactions: [],
    });
    await expect(api.listOperations(context, "cosmos1a", { minHeight: 0 })).resolves.toEqual({
      items: [],
    });
    await expect(api.getStakes(context, "cosmos1a")).resolves.toEqual({ items: [] });
    await expect(api.getValidators(context)).resolves.toEqual({ items: [] });
    await expect(api.broadcast(context, "00")).resolves.toBe("HASH");
    await expect(api.validateIntent(context, sendIntent, [])).resolves.toHaveProperty("errors");
    await expect(api.validateAddress(context, "cosmos1sender", {})).resolves.toBe(false);
    expect(() => api.combine(context, "{}", ["00"])).toThrow("public key");
  });

  it.each([
    ["a null getBlock", null],
    ["a null pagination", { pagination: null }],
    ["a zero limit", { pagination: { limit: 0 } }],
  ])("logs and falls back to the default limit for %s", async (_name, invalid) => {
    const api = createApi("cosmos");
    const logger = jest.fn();

    await api.getBlock({ ...makeContext({ ...config, getBlock: invalid } as never), logger }, 7);

    const instance = jest.mocked(CosmosAPI).mock.results.at(-1)?.value;
    expect(logger).toHaveBeenCalledWith(
      "Invalid getBlock configuration for cosmos, using the default",
    );
    expect(instance.getBlockWithTxs).toHaveBeenCalledWith(7, 100);
    expect(instance.getTransactionsByHeight).toHaveBeenCalledWith(7, 100);
  });

  it("does not log for a valid getBlock configuration", async () => {
    const api = createApi("cosmos");
    const logger = jest.fn();

    await api.getBlock({ ...context, logger }, 7);

    expect(logger).not.toHaveBeenCalled();
  });

  it("hands the pagination limit of the resolved config to the block queries", async () => {
    const api = createApi("cosmos");
    const limitedContext = makeContext({ ...config, getBlock: { pagination: { limit: 25 } } });

    await api.getBlock(limitedContext, 7);

    const instance = jest.mocked(CosmosAPI).mock.results.at(-1)?.value;
    expect(instance.getBlockWithTxs).toHaveBeenCalledWith(7, 25);
    expect(instance.getTransactionsByHeight).toHaveBeenCalledWith(7, 25);
  });

  it("threads each currency's config from its own context into the CosmosAPI (no singleton seeding)", async () => {
    (CosmosAPI as unknown as jest.Mock).mockClear();

    const cosmosConfig = {
      lcd: "https://cosmos-a",
      status: { type: "active" },
    } as unknown as CosmosCoinConfig;
    const osmosisConfig = {
      lcd: "https://osmosis-b",
      status: { type: "active" },
    } as unknown as CosmosCoinConfig;

    const cosmosApi = createApi("cosmos");
    await cosmosApi.lastBlock(makeContext(cosmosConfig));
    expect(CosmosAPI).toHaveBeenLastCalledWith("cosmos", undefined, cosmosConfig);

    const osmosisApi = createApi("osmosis");
    await osmosisApi.lastBlock(makeContext(osmosisConfig));
    expect(CosmosAPI).toHaveBeenLastCalledWith("osmosis", undefined, osmosisConfig);
  });
});

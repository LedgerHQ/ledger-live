import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosCoinConfig, CosmosContext } from "../config";
import { CosmosAPI } from "../network/Cosmos";

jest.mock("../network/Cosmos", () => ({
  CosmosAPI: jest.fn().mockImplementation(() => ({
    getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
    getAllBalances: jest.fn().mockResolvedValue({ toFixed: () => "0" }),
    getAccount: jest
      .fn()
      .mockResolvedValue({ accountNumber: 0, sequence: 0, pubKeyType: "", pubKey: "" }),
    getLatestBlockInfo: jest.fn().mockResolvedValue({ height: 1, hash: "hash", time: new Date() }),
    getTransactionsPage: jest.fn().mockResolvedValue({ txs: [], hasMore: false }),
    getValidators: jest.fn().mockResolvedValue([]),
    getDelegations: jest.fn().mockResolvedValue([]),
    getUnbondings: jest.fn().mockResolvedValue([]),
    getStakingPositions: jest.fn().mockResolvedValue({ delegations: [], unbondings: [] }),
    broadcastRawTransaction: jest.fn().mockResolvedValue("HASH"),
  })),
}));

import { createApi } from "./index";

const config = { status: { type: "active" } } as unknown as CosmosCoinConfig;

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
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getBlockInfo",
        "getRewards",
        "register",
      ],
      inconsistent: [],
    });
  });
  it("declares every method the chain supports", () => {
    const api = createApi("cosmos") as unknown as Record<string, unknown>;

    const methods = [
      "getBalance",
      "getNextSequence",
      "lastBlock",
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

import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosCoinConfig } from "../config";

jest.mock("../network/Cosmos", () => ({
  CosmosAPI: jest.fn().mockImplementation(() => ({
    getAllBalances: jest.fn().mockResolvedValue({ toFixed: () => "0" }),
    getAccount: jest
      .fn()
      .mockResolvedValue({ accountNumber: 0, sequence: 0, pubKeyType: "", pubKey: "" }),
    getLatestBlockInfo: jest.fn().mockResolvedValue({ height: 1, hash: "hash", time: new Date() }),
    getTransactionsPage: jest.fn().mockResolvedValue({ txs: [], hasMore: false }),
    getValidators: jest.fn().mockResolvedValue([]),
    getDelegations: jest.fn().mockResolvedValue([]),
    getUnbondings: jest.fn().mockResolvedValue([]),
    broadcastRawTransaction: jest.fn().mockResolvedValue("HASH"),
  })),
}));

import { createApi } from "./index";

const config = { status: { type: "active" } } as unknown as CosmosCoinConfig;

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("api/createApi", () => {
  it("returns a CoinModuleApi with all supported methods wired", () => {
    const api = createApi(config, "cosmos") as unknown as Record<string, unknown>;

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

  it("throws 'not supported' for the unsupported methods", () => {
    const api = createApi(config, "cosmos");

    expect(() => api.getRewards("addr")).toThrow("getRewards is not supported");
    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
    expect(() => api.craftRawTransaction("tx", "sender", "pubkey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("wires the supported delegations to the logic layer", async () => {
    const api = createApi(config, "cosmos");

    await expect(api.getBalance("cosmos1a")).resolves.toEqual([
      { value: 0n, asset: { type: "native" } },
    ]);
    await expect(api.getNextSequence("cosmos1a")).resolves.toBe(0n);
    await expect(api.lastBlock()).resolves.toHaveProperty("height", 1);
    await expect(api.listOperations("cosmos1a", { minHeight: 0 })).resolves.toEqual({ items: [] });
    await expect(api.getStakes("cosmos1a")).resolves.toEqual({ items: [] });
    await expect(api.getValidators()).resolves.toEqual({ items: [] });
    await expect(api.broadcast("00")).resolves.toBe("HASH");
    await expect(api.validateIntent(sendIntent, [])).resolves.toHaveProperty("errors");
    await expect(api.validateAddress("cosmos1sender", {})).resolves.toBe(false);
    expect(() => api.combine("{}", "00")).toThrow("public key");
  });
});

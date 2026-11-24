jest.mock("@ledgerhq/coin-evm/api", () => {
  const methods = [
    "broadcast",
    "combine",
    "craftTransaction",
    "craftRawTransaction",
    "estimateFees",
    "getBalance",
    "listOperations",
    "lastBlock",
    "getBlock",
    "getBlockInfo",
    "getStakes",
    "getRewards",
    "getValidators",
    "getNextSequence",
    "validateAddress",
    "validateIntent",
    "craftTransactionData",
    "validateTransaction",
  ];
  const evmApiStub: Record<string, unknown> = Object.fromEntries(
    methods.map(name => [name, jest.fn()]),
  );
  return { createApi: jest.fn(() => evmApiStub) };
});

jest.mock("../network/client", () => {
  const sendRawTransaction = jest.fn(async () => "0xbroadcasthash");
  return {
    getCeloClient: jest.fn(() => ({ sendRawTransaction })),
    celoEstimateGas: jest.fn(),
  };
});

import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { getCeloClient } from "../network/client";
import { createApi } from "./index";

const mockCtx: Context<EvmConfigInfo> = {
  config: async () => ({}) as EvmConfigInfo,
  logger: () => {},
};

const COIN_MODULE_API_METHODS = [
  "broadcast",
  "combine",
  "craftTransaction",
  "craftRawTransaction",
  "estimateFees",
  "getBalance",
  "listOperations",
  "lastBlock",
  "getBlock",
  "getBlockInfo",
  "getStakes",
  "getRewards",
  "getValidators",
  "getNextSequence",
  "validateAddress",
  "validateIntent",
  "craftTransactionData",
];

describe("createApi", () => {
  beforeEach(() => {
    (createEvmApi as jest.Mock).mockClear();
  });

  it("exposes every CoinModuleApi method as a function", () => {
    const api = createApi() as unknown as Record<string, unknown>;
    for (const method of COIN_MODULE_API_METHODS) {
      expect(typeof api[method]).toBe("function");
    }
  });

  it("delegates the generic EVM methods to the coin-evm api", () => {
    const api = createApi();
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect(api.lastBlock).toBe(evmApi.lastBlock);
    expect(api.getNextSequence).toBe(evmApi.getNextSequence);
    expect(api.validateAddress).toBe(evmApi.validateAddress);
  });

  it("reports GoldToken transfers of listOperations and getBlock as native CELO", async () => {
    const api = createApi();
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;
    const celoErc20 = "0x471EcE3750Da237f93B8E339c536989b8978a438";
    const transfer = { asset: { type: "erc20", assetReference: celoErc20 } };
    const options = { minHeight: 0 };
    evmApi.listOperations.mockResolvedValueOnce({ items: [transfer], next: "cursor" });
    evmApi.getBlock.mockResolvedValueOnce({
      transactions: [{ operations: [{ type: "transfer", ...transfer }] }],
    });

    const page = await api.listOperations(mockCtx, "0xabc", options);
    const block = await api.getBlock(mockCtx, 1);

    expect(evmApi.listOperations).toHaveBeenCalledWith(mockCtx, "0xabc", options);
    expect(evmApi.getBlock).toHaveBeenCalledWith(mockCtx, 1);
    expect(page).toEqual({ items: [{ asset: { type: "native" } }], next: "cursor" });
    expect(block.transactions[0].operations).toEqual([
      { type: "transfer", asset: { type: "native" } },
    ]);
  });

  it("overrides the Celo-specific (CIP-64) methods instead of delegating", () => {
    const api = createApi();
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect(api.craftTransaction).not.toBe(evmApi.craftTransaction);
    expect(api.estimateFees).not.toBe(evmApi.estimateFees);
    expect(api.combine).not.toBe(evmApi.combine);
    expect(api.broadcast).not.toBe(evmApi.broadcast);
  });

  it("advertises staking support and wires the staking read methods", () => {
    const api = createApi();
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect(typeof api.getStakes).toBe("function");
    expect(typeof api.getValidators).toBe("function");
    expect(typeof api.getRewards).toBe("function");
    // getBalance is wrapped (not delegated) to surface Celo staking positions via Balance.stake
    expect(api.getBalance).not.toBe(evmApi.getBalance);
  });

  it("getRewards rejects with not supported (Celo has no discrete on-chain reward events)", async () => {
    const api = createApi();
    await expect(api.getRewards(mockCtx, "0xabc")).rejects.toThrow(/not supported/);
  });

  it("validates a staking (lock) intent against the native balance", async () => {
    const api = createApi();
    const intent = {
      intentType: "staking",
      type: "celo.lock",
      sender: "0x7777777777777777777777777777777777777777",
      recipient: "",
      amount: 100n,
      asset: { type: "native" },
      data: { type: "buffer", value: Buffer.from([]) },
    };
    const balances = [{ value: 1000n, asset: { type: "native" } }];
    const customFees = {
      value: 10n,
      parameters: { type: "eip1559", maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, gasLimit: 5n },
    };

    const res = await api.validateIntent(
      mockCtx as unknown as Parameters<typeof api.validateIntent>[0],
      intent as unknown as Parameters<typeof api.validateIntent>[1],
      balances as unknown as Parameters<typeof api.validateIntent>[2],
      { customFees } as unknown as Parameters<typeof api.validateIntent>[3],
    );

    expect(res.amount).toBe(100n);
    expect(res.totalSpent).toBe(110n);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it("delegates non-staking validateIntent to the coin-evm api", async () => {
    const api = createApi();
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;
    const intent = {
      intentType: "transaction",
      type: "send",
      sender: "0xa",
      recipient: "0xb",
      amount: 1n,
      asset: { type: "native" },
      data: { type: "buffer", value: Buffer.from([]) },
    };
    const balances: unknown[] = [];

    await api.validateIntent(
      mockCtx as unknown as Parameters<typeof api.validateIntent>[0],
      intent as unknown as Parameters<typeof api.validateIntent>[1],
      balances as unknown as Parameters<typeof api.validateIntent>[2],
    );

    expect(evmApi.validateIntent).toHaveBeenCalledWith(mockCtx, intent, balances, undefined);
  });

  it("broadcasts by forwarding the raw transaction to the node", async () => {
    const api = createApi();
    const hash = await api.broadcast(mockCtx, "0xdeadbeef");

    const { sendRawTransaction } = (getCeloClient as jest.Mock)();
    expect(sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: "0xdeadbeef" });
    expect(hash).toBe("0xbroadcasthash");
  });
});

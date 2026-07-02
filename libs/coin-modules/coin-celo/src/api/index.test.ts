jest.mock("@ledgerhq/coin-evm/api/index", () => {
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
  // coin-evm advertises EVM-staking support for Celo; the Celo api now implements
  // its own (LockedGold + Election) staking and advertises stakingSupported: true.
  evmApiStub.stakingSupported = true;
  return { createApi: jest.fn(() => evmApiStub) };
});

jest.mock("../network/client", () => {
  const sendRawTransaction = jest.fn(async () => "0xbroadcasthash");
  return {
    getCeloClient: jest.fn(() => ({ sendRawTransaction })),
    celoEstimateGas: jest.fn(),
  };
});

import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { getCeloClient } from "../network/client";
import { getRewards } from "./getRewards";
import { getStakes } from "./getStakes";
import { getValidators } from "./getValidators";
import { createApi } from "./index";

const config = {} as Parameters<typeof createApi>[0];

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
    const api = createApi(config) as unknown as Record<string, unknown>;
    for (const method of COIN_MODULE_API_METHODS) {
      expect(typeof api[method]).toBe("function");
    }
  });

  it("delegates the generic EVM methods to the coin-evm api", () => {
    const api = createApi(config);
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect(api.listOperations).toBe(evmApi.listOperations);
    expect(api.lastBlock).toBe(evmApi.lastBlock);
    expect(api.getNextSequence).toBe(evmApi.getNextSequence);
    expect(api.validateAddress).toBe(evmApi.validateAddress);
  });

  it("overrides the Celo-specific (CIP-64) methods instead of delegating", () => {
    const api = createApi(config);
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect(api.craftTransaction).not.toBe(evmApi.craftTransaction);
    expect(api.estimateFees).not.toBe(evmApi.estimateFees);
    expect(api.combine).not.toBe(evmApi.combine);
    expect(api.broadcast).not.toBe(evmApi.broadcast);
  });

  it("advertises staking support and wires the staking read methods", () => {
    const api = createApi(config);
    const evmApi = (createEvmApi as jest.Mock).mock.results[0].value;

    expect((api as { stakingSupported?: boolean }).stakingSupported).toBe(true);
    expect(api.getStakes).toBe(getStakes);
    expect(api.getValidators).toBe(getValidators);
    expect(api.getRewards).toBe(getRewards);
    // getBalance is wrapped (not delegated) to surface Celo staking positions via Balance.stake
    expect(api.getBalance).not.toBe(evmApi.getBalance);
  });

  it("getRewards rejects with not supported (Celo has no discrete on-chain reward events)", async () => {
    const api = createApi(config);
    await expect(api.getRewards("0xabc")).rejects.toThrow(/not supported/);
  });

  it("validates a staking (lock) intent against the native balance", async () => {
    const api = createApi(config);
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
      intent as unknown as Parameters<typeof api.validateIntent>[0],
      balances as unknown as Parameters<typeof api.validateIntent>[1],
      customFees as unknown as Parameters<typeof api.validateIntent>[2],
    );

    expect(res.amount).toBe(100n);
    expect(res.totalSpent).toBe(110n);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it("delegates non-staking validateIntent to the coin-evm api", async () => {
    const api = createApi(config);
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
      intent as unknown as Parameters<typeof api.validateIntent>[0],
      balances as unknown as Parameters<typeof api.validateIntent>[1],
    );

    expect(evmApi.validateIntent).toHaveBeenCalledWith(intent, balances, undefined);
  });

  it("broadcasts by forwarding the raw transaction to the node", async () => {
    const api = createApi(config);
    const hash = await api.broadcast("0xdeadbeef");

    const { sendRawTransaction } = (getCeloClient as jest.Mock)();
    expect(sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: "0xdeadbeef" });
    expect(hash).toBe("0xbroadcasthash");
  });
});

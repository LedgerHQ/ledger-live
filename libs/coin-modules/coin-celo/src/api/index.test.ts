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
  // coin-evm advertises EVM-staking support for Celo — the api under test must strip it.
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

    expect(api.getBalance).toBe(evmApi.getBalance);
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

  it("does not advertise staking and throws for staking methods", () => {
    const api = createApi(config);

    expect((api as { stakingSupported?: boolean }).stakingSupported).toBeUndefined();
    expect(() => api.getStakes("0xabc")).toThrow(/not supported/);
    expect(() => api.getRewards("0xabc")).toThrow(/not supported/);
    expect(() => api.getValidators()).toThrow(/not supported/);
  });

  it("broadcasts by forwarding the raw transaction to the node", async () => {
    const api = createApi(config);
    const hash = await api.broadcast("0xdeadbeef");

    const { sendRawTransaction } = (getCeloClient as jest.Mock)();
    expect(sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: "0xdeadbeef" });
    expect(hash).toBe("0xbroadcasthash");
  });
});

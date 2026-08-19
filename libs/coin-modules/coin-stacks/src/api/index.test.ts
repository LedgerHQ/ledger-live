import type { StacksContext } from "../config";
import { createApi } from "./index";

const context: StacksContext = {
  config: async () => ({
    status: { type: "active" as const },
    config_currency_stacks: {
      type: "object" as const,
      default: { status: { type: "active" as const } },
    },
  }),
  logger: () => {},
};

describe("createApi", () => {
  const api = createApi();

  it("wires every method the interface declares", () => {
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.validateIntent).toBeInstanceOf(Function);
    expect(api.getNextSequence).toBeInstanceOf(Function);
    expect(api.validateAddress).toBeInstanceOf(Function);
    expect(api.craftTransactionData).toBeInstanceOf(Function);
    expect(api.getStakes).toBeInstanceOf(Function);
  });

  it("throws if combine receives anything other than exactly one signature", () => {
    expect(() => api.combine(context, "0xdeadbeef", [])).toThrow(
      "combine expects exactly one signature",
    );
    expect(() => api.combine(context, "0xdeadbeef", ["sig1", "sig2"])).toThrow(
      "combine expects exactly one signature",
    );
  });

  it("throws 'not supported' for call", async () => {
    await expect(api.call(context, {})).rejects.toThrow("call is not supported");
  });

  it("throws 'not supported' for craftRawTransaction", () => {
    expect(() => api.craftRawTransaction(context, "tx", "sender", "pub", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("throws 'not supported' for getRewards", () => {
    expect(() => api.getRewards(context, "address")).toThrow("getRewards is not supported");
  });

  it("throws 'not supported' for getValidators", () => {
    expect(() => api.getValidators(context)).toThrow("getValidators is not supported");
  });

  it("validates a well-formed address", async () => {
    await expect(
      api.validateAddress(context, "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9", {
        currencyId: "stacks",
        networkId: 0,
      }),
    ).resolves.toBe(true);
  });

  it("getBalance rejects unsupported options without reaching the network", async () => {
    await expect(
      api.getBalance(context, "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9", {
        includeAssets: async () => true,
      }),
    ).rejects.toThrow("getBalance does not support the options parameter");
  });
});

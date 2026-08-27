import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("createApi", () => {
  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  // Each of these had a file of its own asserting the framework's error; the report covers them
  // together, and covers `call` and `register`, which had none.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi("cardano"), mockCtx)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getBlockInfo",
        "getNextSequence",
        "getRewards",
        "register",
      ],
      inconsistent: [],
    });
  });

  it("declares every method the chain supports", () => {
    const impl = createApi("cardano");

    expect(impl).toEqual({
      lastBlock: expect.any(Function),
      getValidators: expect.any(Function),
      getBalance: expect.any(Function),
      listOperations: expect.any(Function),
      getStakes: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      combine: expect.any(Function),
      broadcast: expect.any(Function),
      validateIntent: expect.any(Function),
      validateAddress: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });
});

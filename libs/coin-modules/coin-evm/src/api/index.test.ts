import { EvmConfig } from "../config";
import { createApi } from "./index";

describe.each([
  [
    "with explorer",
    { explorer: { type: "ledger" } },
    {
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      computeIntentType: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getAssetFromToken: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getSequence: expect.any(Function),
      getStakes: expect.any(Function),
      getTokenFromAsset: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateIntent: expect.any(Function),
    },
  ],
  [
    "without explorer",
    { explorer: { type: "none" } },
    {
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      computeIntentType: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getAssetFromToken: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getSequence: expect.any(Function),
      getStakes: expect.any(Function),
      getTokenFromAsset: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateIntent: expect.any(Function),
      refreshOperations: expect.any(Function),
    },
  ],
])("Alpaca methods %s", (_s, config, methods) => {
  it("ensures methods are presents", () => {
    expect(createApi(config as EvmConfig, "ethereum")).toEqual(methods);
  });
});

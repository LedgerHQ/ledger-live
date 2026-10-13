import { getSerializedAddressParameters } from "./exchange";
import { decorateOptimisticOperation } from "./pending";
import { computeIntentType as fromSelection } from "./selection";
import { bitcoinAccountLayer, computeIntentType } from "./index";

describe("bitcoinAccountLayer", () => {
  it("is the multi-address engine run with the bitcoin family", () => {
    expect(bitcoinAccountLayer).toEqual({
      getAccountShape: expect.any(Function),
      completeIntent: expect.any(Function),
      postSync: expect.any(Function),
      decorateOptimisticOperation,
      getSerializedAddressParameters,
    });
    expect(computeIntentType).toBe(fromSelection);
  });
});

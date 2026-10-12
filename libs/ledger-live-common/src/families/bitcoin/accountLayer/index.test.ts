jest.mock("./sync", () => ({ getAccountShape: jest.fn(async () => ({ id: "shape" })) }));
import { getAccountShape } from "./sync";
import { getSerializedAddressParameters } from "./exchange";
import { decorateOptimisticOperation, postSync } from "./pending";
import { completeIntent, computeIntentType as fromSelection } from "./selection";
import { bitcoinAccountLayer, computeIntentType } from "./index";

describe("bitcoinAccountLayer", () => {
  it("wires the account layer of the family", async () => {
    expect(bitcoinAccountLayer).toMatchObject({
      completeIntent,
      postSync,
      decorateOptimisticOperation,
      getSerializedAddressParameters,
    });
    expect(computeIntentType).toBe(fromSelection);
  });

  it("syncs without the sync config", async () => {
    const info = { currency: {} } as never;
    const dependencies = { api: {}, context: {}, signerContext: jest.fn() } as never;
    expect(
      await bitcoinAccountLayer.getAccountShape(info, { paginationConfig: {} }, dependencies),
    ).toEqual({
      id: "shape",
    });
    expect(getAccountShape).toHaveBeenCalledWith(info, dependencies);
  });
});

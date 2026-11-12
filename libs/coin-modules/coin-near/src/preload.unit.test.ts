import BigNumber from "bignumber.js";
import { hydrate } from "./preload";
import { getCurrentNearPreloadData } from "./preload-data";

describe("hydrate", () => {
  it("keeps current values for missing or non-numeric preloaded fields", () => {
    const { storageCost } = getCurrentNearPreloadData();

    expect(() =>
      hydrate({ storageCost: "n/a", gasPrice: "100", addKeyCostSend: {} }),
    ).not.toThrow();

    const hydrated = getCurrentNearPreloadData();
    expect(hydrated.storageCost).toEqual(storageCost);
    expect(hydrated.gasPrice).toEqual(new BigNumber(100));
    expect(hydrated.addKeyCostSend).toEqual(new BigNumber(0));
  });
});

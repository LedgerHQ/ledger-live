import { nearDefaults, setCoinConfig } from "./config";
import { hydrate, preload } from "./preload";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";

describe("preload (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => nearDefaults.near);
  });

  it("resolves the gas price and the protocol costs", async () => {
    const data = await preload();

    expect(data.gasPrice.isNaN()).toBe(false);
    expect(data.gasPrice.gt(0)).toBe(true);
    expect(data.storageCost.gt(0)).toBe(true);
  }, 120_000);

  it("survives the serialize and hydrate round trip", async () => {
    const data = await preload();

    setNearPreloadData({ ...data, gasPrice: data.gasPrice.plus(1) });

    hydrate(JSON.parse(JSON.stringify(data)));
    const rehydrated = getCurrentNearPreloadData();

    expect(rehydrated.gasPrice.toFixed()).toBe(data.gasPrice.toFixed());
    expect(rehydrated.storageCost.toFixed()).toBe(data.storageCost.toFixed());
  }, 120_000);
});

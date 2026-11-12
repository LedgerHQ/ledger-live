import { setCoinConfig } from "./config";
import { hydrate, preload } from "./preload";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";

describe("preload (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      name: "NEAR",
      unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
        API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
      },
    }));
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

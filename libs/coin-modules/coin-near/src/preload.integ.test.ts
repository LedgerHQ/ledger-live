import { setCoinConfig } from "./config";
import { hydrate, preload } from "./preload";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";

const VALIDATOR_COUNT = 200;

describe("preload (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger.com/indexer",
        API_NEARBLOCKS_INDEXER: "https://near-indexer.coin.ledger.com",
      },
    }));
  });

  it("resolves validators, gas price and the protocol costs", async () => {
    const data = await preload();

    expect(data.validators).toHaveLength(VALIDATOR_COUNT);
    expect(new Set(data.validators.map(validator => validator.validatorAddress)).size).toBe(
      VALIDATOR_COUNT,
    );
    expect(data.gasPrice.isNaN()).toBe(false);
    expect(data.gasPrice.gt(0)).toBe(true);
    expect(data.storageCost.gt(0)).toBe(true);

    data.validators.forEach(validator => {
      expect(validator.validatorAddress).toMatch(/\S/);
      expect(String(validator.tokens)).toMatch(/^\d+$/);
      expect(validator.commission).toBeGreaterThanOrEqual(0);
      expect(validator.commission).toBeLessThanOrEqual(100);
    });
  }, 120_000);

  it("survives the serialize and hydrate round trip", async () => {
    const data = await preload();

    setNearPreloadData({ ...data, validators: [] });
    expect(getCurrentNearPreloadData().validators).toHaveLength(0);

    hydrate(JSON.parse(JSON.stringify(data)));
    const rehydrated = getCurrentNearPreloadData();

    expect(rehydrated.validators).toHaveLength(VALIDATOR_COUNT);
    expect(rehydrated.gasPrice.toFixed()).toBe(data.gasPrice.toFixed());
    expect(rehydrated.storageCost.toFixed()).toBe(data.storageCost.toFixed());
    expect(rehydrated.validators[0].validatorAddress).toBe(data.validators[0].validatorAddress);
  }, 120_000);
});

import BigNumber from "bignumber.js";
import hederaCoinConfig from "./config";
import { preload } from "./preload";
import { getCurrentHederaPreloadData } from "./preload-data";
import { getMockedConfig } from "./test/fixtures/config.fixture";
import { getMockedCurrency } from "./test/fixtures/currency.fixture";

describe("preload", () => {
  const currency = getMockedCurrency();
  let preloadData: Awaited<ReturnType<typeof preload>>;

  beforeAll(async () => {
    hederaCoinConfig.setCoinConfig(() => getMockedConfig());
    preloadData = await preload(currency);
  });

  it("fetches validators from mirror node and returns a non-empty list", () => {
    expect(preloadData.validators.length).toBeGreaterThan(0);
  });

  it("returns validators with the correct shape", () => {
    const [first] = preloadData.validators;

    // addressChecksum is null for some nodes — allow null or string
    expect(first).toMatchObject({
      nodeId: expect.any(Number),
      address: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      name: expect.any(String),
      minStake: expect.any(BigNumber),
      maxStake: expect.any(BigNumber),
      activeStake: expect.any(BigNumber),
      activeStakePercentage: expect.any(BigNumber),
      overstaked: expect.any(Boolean),
    });
    expect(first.addressChecksum === null || typeof first.addressChecksum === "string").toBe(true);
  });

  it("persists the fetched data into the preload store", () => {
    const stored = getCurrentHederaPreloadData(currency);

    expect(stored.validators.length).toBeGreaterThan(0);
  });

  it("all returned validators have non-negative activeStakePercentage", () => {
    for (const v of preloadData.validators) {
      expect(v.activeStakePercentage.isGreaterThanOrEqualTo(0)).toBe(true);
    }
  });
});

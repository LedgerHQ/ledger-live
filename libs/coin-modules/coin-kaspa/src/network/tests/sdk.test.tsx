import { getBalanceForAddress, getFees } from "../sdk";

describe("getFees", () => {
  it("Check if getFees gives correct output", async () => {

    const result = await getFees();

    expect(result.priorityBucket?.feerate).toBeGreaterThan(0);
    expect(result.normalBuckets.length).toBeGreaterThan(0);
    expect(result.lowBuckets.length).toBeGreaterThan(0);

  });
});

describe("getBalancesForAddresses", () => {
  it("Check if getBalancesForAddresses gives correct output", async () => {

    const result = await getBalanceForAddress();

    expect(result.priorityBucket?.feerate).toBeGreaterThan(0);
    expect(result.normalBuckets.length).toBeGreaterThan(0);
    expect(result.lowBuckets.length).toBeGreaterThan(0);

  });
});


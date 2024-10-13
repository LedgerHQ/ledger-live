import { getFeeEstimate } from "../indexer-api/getFeeEstimate";

describe("getFees", () => {
  it("Check if getFees gives correct output", async () => {
    const result = await getFeeEstimate();

    expect(result.priorityBucket.feerate).toBeGreaterThan(0);
    expect(result.priorityBucket.estimatedSeconds).toBeGreaterThan(0);
    expect(result.normalBuckets.length).toBeGreaterThan(0);
    expect(result.normalBuckets[0].feerate).toBeGreaterThan(0);
    expect(result.normalBuckets[0].estimatedSeconds).toBeGreaterThan(0);
    expect(result.lowBuckets.length).toBeGreaterThan(0);
    expect(result.lowBuckets[0].feerate).toBeGreaterThan(0);
    expect(result.lowBuckets[0].estimatedSeconds).toBeGreaterThan(0);
  });
});

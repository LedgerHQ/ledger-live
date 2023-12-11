import { getRatesExpirationThreshold } from "./quotesRate";

describe("getRatesExpirationThreshold", () => {
  it("should be 20 seconds", async () => {
    expect(getRatesExpirationThreshold()).toEqual(20 * 1000);
  });
});

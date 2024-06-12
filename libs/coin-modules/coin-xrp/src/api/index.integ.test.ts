import { createApi } from ".";

describe("estimateFees", () => {
  it("returns a default value", async () => {
    const module = createApi({ node: "https://xrplcluster.com/ledgerlive" });
    const result = await module.estimateFees();

    expect(result).not.toBeNull();
    expect(result).toEqual(BigInt(10));
  });
});

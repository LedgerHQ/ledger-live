import { validateAddress } from "../validateAddress";

describe("validateAddress (real)", () => {
  it("should accept a known mainnet address", async () => {
    const result = await validateAddress("7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE", {});
    expect(result).toBe(true);
  });

  it("should reject garbage", async () => {
    const result = await validateAddress("xyz123!!!", {});
    expect(result).toBe(false);
  });
});

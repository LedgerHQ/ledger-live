import { validateAddress } from "../validateAddress";

describe("validateAddress", () => {
  it("should return true for a valid base58 Solana address", async () => {
    const result = await validateAddress("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM", {});
    expect(result).toBe(true);
  });

  it("should return true for another valid address", async () => {
    const result = await validateAddress("7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE", {});
    expect(result).toBe(true);
  });

  it("should return false for an invalid address", async () => {
    const result = await validateAddress("not-a-valid-address!!!", {});
    expect(result).toBe(false);
  });

  it("should return false for an empty string", async () => {
    const result = await validateAddress("", {});
    expect(result).toBe(false);
  });

  it("should return false for a string with invalid characters", async () => {
    const result = await validateAddress("0OIl", {});
    expect(result).toBe(false);
  });
});

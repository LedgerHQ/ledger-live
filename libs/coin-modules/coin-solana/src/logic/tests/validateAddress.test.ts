import { validateAddress } from "../validateAddress";

describe("validateAddress (integration)", () => {
  it("should validate a correct Solana address", async () => {
    const result = await validateAddress("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM", {});
    expect(result).toBe(true);
  });

  it("should reject an invalid address", async () => {
    const result = await validateAddress("invalid", {});
    expect(result).toBe(false);
  });
});

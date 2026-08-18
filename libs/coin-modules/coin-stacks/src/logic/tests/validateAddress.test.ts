import { validateAddress } from "../validateAddress";

describe("validateAddress", () => {
  it("returns true for a well-formed Stacks address", async () => {
    await expect(
      validateAddress("SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9", {
        currencyId: "stacks",
        networkId: 0,
      }),
    ).resolves.toBe(true);
  });

  it("returns false for a malformed address", async () => {
    await expect(
      validateAddress("not-an-address", { currencyId: "stacks", networkId: 0 }),
    ).resolves.toBe(false);
  });
});

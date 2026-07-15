import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it("returns true for valid erd1 address", async () => {
    const result = await validateAddress(
      "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      {},
    );
    expect(result).toBe(true);
  });

  it("returns false for invalid address", async () => {
    const result = await validateAddress("not-an-address", {});
    expect(result).toBe(false);
  });

  it("returns false for empty string", async () => {
    const result = await validateAddress("", {});
    expect(result).toBe(false);
  });

  it("returns false for wrong prefix", async () => {
    const result = await validateAddress(
      "erd2spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      {},
    );
    expect(result).toBe(false);
  });
});

import { validateAddress } from "../validateAddress";

describe("logic/validateAddress", () => {
  it("throws when no currencyId is provided", async () => {
    await expect(validateAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", {})).rejects.toThrow(
      /Missing currency parameter/,
    );
  });

  it("returns false when the currencyId is not a known currency", async () => {
    const result = await validateAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", {
      currencyId: "not-a-currency",
    });
    expect(result).toBe(false);
  });
});

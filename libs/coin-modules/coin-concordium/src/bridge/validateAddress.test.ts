import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const parameters = {} as unknown as AddressValidationCurrencyParameters;

  it("should return true for a valid Concordium address", async () => {
    const result = await validateAddress(
      "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
      parameters,
    );
    expect(result).toBe(true);
  });

  it("should return false for an invalid address", async () => {
    const result = await validateAddress("not-a-valid-address", parameters);
    expect(result).toBe(false);
  });

  it("should return false for an empty string", async () => {
    const result = await validateAddress("", parameters);
    expect(result).toBe(false);
  });
});

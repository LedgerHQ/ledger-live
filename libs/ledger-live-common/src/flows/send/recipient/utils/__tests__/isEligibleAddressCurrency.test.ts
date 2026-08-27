import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { isEligibleAddressCurrency } from "../isEligibleAddressCurrency";

const ETHEREUM = getCryptoCurrencyById("ethereum");
const BITCOIN = getCryptoCurrencyById("bitcoin");

describe("isEligibleAddressCurrency", () => {
  it("accepts a network whose family is eligible", () => {
    expect(isEligibleAddressCurrency(["evm"], ETHEREUM)).toBe(true);
  });

  it("rejects a network whose family is not eligible", () => {
    expect(isEligibleAddressCurrency(["evm"], BITCOIN)).toBe(false);
  });

  it("resolves a token through the family of its parent network", () => {
    const token = mockTokenCurrency({ parentCurrencyId: ETHEREUM.id });

    expect(isEligibleAddressCurrency(["evm"], token)).toBe(true);
    expect(isEligibleAddressCurrency(["bitcoin"], token)).toBe(false);
  });

  it("rejects a missing currency", () => {
    expect(isEligibleAddressCurrency(["evm"], null)).toBe(false);
    expect(isEligibleAddressCurrency(["evm"], undefined)).toBe(false);
  });

  it("rejects every currency when no family is eligible", () => {
    expect(isEligibleAddressCurrency([], ETHEREUM)).toBe(false);
  });
});

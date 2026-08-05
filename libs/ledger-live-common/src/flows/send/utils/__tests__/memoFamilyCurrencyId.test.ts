import { getMemoFamilyCurrencyId } from "../memoFamilyCurrencyId";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

describe("getMemoFamilyCurrencyId", () => {
  it("returns undefined when currency is missing", () => {
    expect(getMemoFamilyCurrencyId(undefined)).toBeUndefined();
    expect(getMemoFamilyCurrencyId(null)).toBeUndefined();
  });

  it("returns the currency id for a crypto currency", () => {
    const stellar = { type: "CryptoCurrency", id: "stellar" } as CryptoCurrency;
    expect(getMemoFamilyCurrencyId(stellar)).toBe("stellar");
  });

  it("returns the parent currency id for a token currency", () => {
    const usdc = {
      type: "TokenCurrency",
      id: "stellar/asset/USDC/GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KBX3IMXAIXG4LSOGSZNHQ",
      parentCurrencyId: "stellar",
    } as TokenCurrency;
    expect(getMemoFamilyCurrencyId(usdc)).toBe("stellar");
  });
});

import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CURRENCY_NOTICES } from "./currencyNotices";

describe("CURRENCY_NOTICES", () => {
  it.each(Object.keys(CURRENCY_NOTICES))("is keyed by a known currency id: %s", currencyId => {
    expect(findCryptoCurrencyById(currencyId)).toBeDefined();
  });
});

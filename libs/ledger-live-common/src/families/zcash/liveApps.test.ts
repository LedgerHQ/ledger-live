/**
 * Neither live-app protocol has a "zcash" family: live apps keep seeing Zcash as a
 * bitcoin-family currency, as they did before it had a family of its own.
 */
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { currencyToWalletAPICurrency } from "../../wallet-api/converters";
import { isWalletAPISupportedCurrency } from "../../wallet-api/helpers";
import { currencyToPlatformCurrency } from "../../platform/converters";
import { isPlatformSupportedCurrency } from "../../platform/helpers";

describe.each(["zcash", "zcash_testnet"])("%s in live apps", currencyId => {
  const currency = getCryptoCurrencyById(currencyId);

  it("is its own family in Ledger Wallet", () => {
    expect(currency.family).toBe("zcash");
  });

  it("is a supported bitcoin-family currency for the Wallet API", () => {
    expect(isWalletAPISupportedCurrency(currency)).toBe(true);
    expect(currencyToWalletAPICurrency(currency)).toMatchObject({ family: "bitcoin" });
  });

  it("is a supported bitcoin-family currency for the live-app SDK", () => {
    expect(isPlatformSupportedCurrency(currency)).toBe(true);
    expect(currencyToPlatformCurrency(currency)).toMatchObject({ family: "bitcoin" });
  });
});

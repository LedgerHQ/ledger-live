import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { isContactDeviceCurrencySupported } from "../device/resolveContactDeviceContext";

/** Mirrors `resolveEligibleAddressCurrencyIds` for a single currency, so the send flow only
 * offers the address book where the device can actually register the address. */
export function isEligibleAddressCurrency(
  eligibleFamilies: readonly string[],
  currency: CryptoCurrency | TokenCurrency | null | undefined,
): boolean {
  if (!currency) {
    return false;
  }

  const network =
    currency.type === "TokenCurrency"
      ? findCryptoCurrencyById(currency.parentCurrencyId)
      : currency;

  return (
    network !== undefined &&
    eligibleFamilies.includes(network.family) &&
    isContactDeviceCurrencySupported(network.id)
  );
}

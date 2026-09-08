import { listCryptoCurrencies, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { isContactDeviceCurrencySupported } from "../device/resolveContactDeviceContext";

export type EligibleAddressNetwork = Readonly<Pick<CryptoCurrency, "id" | "family">>;

/** Every contact address is signed on the device, so an eligible family alone is not enough. */
export function resolveEligibleAddressCurrencyIds(
  eligibleFamilies: readonly string[],
  networks: readonly EligibleAddressNetwork[] = listCryptoCurrencies(),
): CryptoCurrency["id"][] {
  const families = new Set(eligibleFamilies);
  const networkIds = new Set<CryptoCurrency["id"]>();

  for (const network of networks) {
    if (families.has(network.family) && isContactDeviceCurrencySupported(network.id)) {
      networkIds.add(network.id);
    }
  }

  return [...networkIds];
}

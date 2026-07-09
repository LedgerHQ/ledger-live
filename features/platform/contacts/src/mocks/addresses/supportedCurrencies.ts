import type { ContactAddressInput } from "@domain/entity-contact";
import type { SupportedAddressCurrencyIds } from "../../contracts";

export const SUPPORTED_ADDRESS_CURRENCY_IDS = [
  "ethereum",
  "polygon",
  "ethereum/erc20/usd-tether",
] as const satisfies SupportedAddressCurrencyIds;

const SUPPORTED_ADDRESS_CURRENCY_ID_SET = new Set<string>(SUPPORTED_ADDRESS_CURRENCY_IDS);

const NETWORK_SORT_KEYS: Readonly<Record<string, string>> = {
  ethereum: "Ethereum",
  "ethereum/erc20/usd-tether": "Ethereum",
  polygon: "Polygon",
};

export function isSupportedAddressCurrencyId(
  currencyId: ContactAddressInput["currencyId"],
): boolean {
  return SUPPORTED_ADDRESS_CURRENCY_ID_SET.has(currencyId);
}

export function getNetworkSortKey(currencyId: ContactAddressInput["currencyId"]): string {
  return NETWORK_SORT_KEYS[currencyId] ?? currencyId;
}

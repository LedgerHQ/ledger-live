import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  type CryptoOrTokenCurrency,
  type CryptoOrTokenCurrencyId,
  CryptoOrTokenCurrencyIdSchema,
} from "@domain/entity-currency";

export type ResolvedPrefillAddAddressParams = Readonly<{
  address: string;
  currency: {
    currencyId: CryptoOrTokenCurrencyId;
    assetDisplayName: string;
  };
  network: {
    networkId: string;
    displayName: string;
  };
}>;

export type ResolvePrefillAddAddressParamsInput = Readonly<{
  address: string;
  currency: CryptoOrTokenCurrency | null;
}>;

function resolveNetwork(
  currency: CryptoOrTokenCurrency,
): ResolvedPrefillAddAddressParams["network"] {
  if (currency.type !== "TokenCurrency") {
    return {
      networkId: currency.id,
      displayName: currency.name,
    };
  }

  const parentCurrency = getCryptoCurrencyById(currency.parentCurrencyId);
  return {
    networkId: parentCurrency.id,
    displayName: parentCurrency.name,
  };
}

export function resolvePrefillAddAddressParams({
  address,
  currency,
}: ResolvePrefillAddAddressParamsInput): ResolvedPrefillAddAddressParams | undefined {
  const trimmedAddress = address.trim();
  const parsedCurrencyId = CryptoOrTokenCurrencyIdSchema.safeParse(currency?.id);

  if (!currency || trimmedAddress.length === 0 || !parsedCurrencyId.success) {
    return undefined;
  }

  return {
    address: trimmedAddress,
    currency: {
      currencyId: parsedCurrencyId.data,
      assetDisplayName: currency.name,
    },
    network: resolveNetwork(currency),
  };
}

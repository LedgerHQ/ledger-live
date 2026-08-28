import { ContactCurrencyIdSchema, type ContactId } from "@domain/entity-contact";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { OpenPrefillAddAddressParams } from "@features/flow-contacts-add-address";

type ResolvePrefillAddAddressParamsInput = Readonly<{
  contactId: ContactId;
  address: string;
  currency: CryptoOrTokenCurrency | null;
}>;

function resolveNetwork(currency: CryptoOrTokenCurrency): OpenPrefillAddAddressParams["network"] {
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
  contactId,
  address,
  currency,
}: ResolvePrefillAddAddressParamsInput): OpenPrefillAddAddressParams | undefined {
  const trimmedAddress = address.trim();
  const parsedCurrencyId = ContactCurrencyIdSchema.safeParse(currency?.id);

  if (!currency || trimmedAddress.length === 0 || !parsedCurrencyId.success) {
    return undefined;
  }

  return {
    contactId,
    address: trimmedAddress,
    currency: {
      currencyId: parsedCurrencyId.data,
      assetDisplayName: currency.name,
    },
    network: resolveNetwork(currency),
  };
}

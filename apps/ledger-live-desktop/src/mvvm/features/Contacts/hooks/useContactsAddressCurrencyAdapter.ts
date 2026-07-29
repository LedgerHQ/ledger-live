import { useMemo } from "react";
import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "@features/flow-contacts";

function resolveNetworkId(
  currencyId: ContactAddress["currencyId"],
): CryptoCurrency["id"] | undefined {
  const cryptoCurrency = findCryptoCurrencyById(currencyId);

  if (cryptoCurrency) {
    return cryptoCurrency.id;
  }

  const parentCurrencyId = currencyId.split("/")[0];
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  return parentCurrency?.id;
}

export function useContactsAddressCurrencyAdapter(): ContactAddressCurrencyPort {
  return useMemo(
    () => ({
      resolveNetworkId,
    }),
    [],
  );
}

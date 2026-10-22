import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";

export const defaultContactAddressCurrencyPort: ContactAddressCurrencyPort = {
  resolveNetworkId: currencyId => {
    const currency = findCryptoCurrencyById(currencyId);

    if (currency !== undefined) {
      return currency.id;
    }

    return findCryptoCurrencyById(currencyId.split("/")[0])?.id;
  },
};

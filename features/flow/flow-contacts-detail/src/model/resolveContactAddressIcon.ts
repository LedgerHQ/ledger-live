import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddress } from "@domain/entity-contact";

export type ContactAddressIconProps = Readonly<{
  ledgerId: string;
  ticker: string;
  network?: CryptoCurrency["id"];
}>;

export function resolveContactAddressIconProps(
  currencyId: ContactAddress["currencyId"],
  label: ContactAddress["label"],
  networkId: CryptoCurrency["id"],
): ContactAddressIconProps {
  const cryptoCurrency = findCryptoCurrencyById(currencyId);

  if (cryptoCurrency) {
    return {
      ledgerId: cryptoCurrency.id,
      ticker: cryptoCurrency.ticker,
      network: cryptoCurrency.id === networkId ? undefined : networkId,
    };
  }

  return {
    ledgerId: currencyId,
    ticker: label,
    network: networkId,
  };
}

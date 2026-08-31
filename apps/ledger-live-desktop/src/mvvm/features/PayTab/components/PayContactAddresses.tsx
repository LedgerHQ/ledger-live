import React from "react";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Contact } from "@domain/entity-contact";
import { CryptoIconStack, type CryptoIconStackItem } from "LLD/components/CryptoIconStack";

const ICON_SIZE = 24;

function uniqueAddressCurrencies(addresses: Contact["addresses"]): CryptoIconStackItem[] {
  const byLedgerId = new Map<string, CryptoIconStackItem>();

  for (const { currencyId, label } of addresses) {
    const currency = findCryptoCurrencyById(currencyId);
    const ledgerId = currency?.id ?? currencyId;
    if (!byLedgerId.has(ledgerId)) {
      byLedgerId.set(ledgerId, { ledgerId, ticker: currency?.ticker ?? label });
    }
  }

  return [...byLedgerId.values()];
}

export function PayContactAddresses({ addresses }: { addresses: Contact["addresses"] }) {
  return (
    <CryptoIconStack
      size={ICON_SIZE}
      items={uniqueAddressCurrencies(addresses)}
      testID="pay-contacts-address-icons"
      overflowTestID="pay-contacts-address-overflow"
    />
  );
}

export function renderPayContactAddresses(addresses: Contact["addresses"]) {
  return <PayContactAddresses addresses={addresses} />;
}

type ContactAddress = Readonly<{
  currencyId: string;
}>;

export function pickContactAddressForCurrency<T extends ContactAddress>(
  addresses: readonly T[],
  currencyId: string,
): T | undefined {
  const exactCurrencyAddresses = addresses.filter(address => address.currencyId === currencyId);
  if (exactCurrencyAddresses.length === 1) {
    return exactCurrencyAddresses[0];
  }

  return exactCurrencyAddresses.length === 0 && addresses.length === 1 ? addresses[0] : undefined;
}

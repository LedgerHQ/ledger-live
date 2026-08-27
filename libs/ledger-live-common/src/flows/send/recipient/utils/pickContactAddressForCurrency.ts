type ContactAddress = Readonly<{
  currencyId: string;
}>;

export function pickContactAddressForCurrency<T extends ContactAddress>(
  addresses: readonly T[],
  currencyId: string,
): T | undefined {
  const exactCurrencyAddress = addresses.find(address => address.currencyId === currencyId);
  return exactCurrencyAddress ?? (addresses.length === 1 ? addresses[0] : undefined);
}

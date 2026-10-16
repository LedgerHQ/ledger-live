// TODO(LIVE-39366): identity until the backend confirms its currency ids. Never compare raw ids.
export function toLedgerCurrencyId(swapKitCurrencyId: string): string {
  return swapKitCurrencyId;
}

export function toSwapKitCurrencyId(ledgerCurrencyId: string): string {
  return ledgerCurrencyId;
}

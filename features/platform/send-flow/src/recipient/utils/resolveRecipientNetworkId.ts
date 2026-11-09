export function resolveRecipientNetworkId(currencyId: string): string {
  return currencyId.split("/")[0];
}

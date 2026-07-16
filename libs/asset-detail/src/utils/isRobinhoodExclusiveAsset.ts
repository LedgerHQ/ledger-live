const ROBINHOOD_NETWORK_IDS = new Set(["robinhood", "robinhood_testnet"]);

const getNetworkId = (ledgerId: string): string => ledgerId.split("/")[0];

export function isRobinhoodExclusiveAsset(ledgerIds: readonly string[]): boolean {
  return ledgerIds.length > 0 && ledgerIds.every(id => ROBINHOOD_NETWORK_IDS.has(getNetworkId(id)));
}

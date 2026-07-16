/**
 * Networks that make up the Robinhood chain. Tokenized stocks currently live on
 * `robinhood_testnet` only; `robinhood` (mainnet) is included so the check keeps
 * working once stocks ship there.
 */
const ROBINHOOD_NETWORK_IDS = new Set(["robinhood", "robinhood_testnet"]);

/** Network segment of a ledger currency id (`robinhood_testnet/erc20/0x…` → `robinhood_testnet`). */
const getNetworkId = (ledgerId: string): string => ledgerId.split("/")[0];

/**
 * An asset is "Robinhood-exclusive" when every network it is available on is a
 * Robinhood chain. Multi-network assets that merely include a Robinhood network
 * (e.g. WETH, also on Ethereum) are not exclusive and return `false`.
 */
export function isRobinhoodExclusiveAsset(ledgerIds: readonly string[]): boolean {
  return ledgerIds.length > 0 && ledgerIds.every(id => ROBINHOOD_NETWORK_IDS.has(getNetworkId(id)));
}

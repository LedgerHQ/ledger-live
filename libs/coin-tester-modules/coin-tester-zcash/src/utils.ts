import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";

// Utility to find a UTXO that did not exist before (i.e. a new change output).
export function findNewUtxo(previous: ZcashAccount, current: ZcashAccount) {
  const prevSet = new Set(previous.bitcoinResources.utxos.map(u => `${u.hash}:${u.outputIndex}`));
  return current.bitcoinResources.utxos.find(u => !prevSet.has(`${u.hash}:${u.outputIndex}`));
}

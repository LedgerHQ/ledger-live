import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { getCurrentBlock } from "./helpers";
import network from "@ledgerhq/live-network/network";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForExplorerSync(
  url: string = "http://localhost:9876/blockchain/v4/btc_regtest/block/current",
  pollInterval: number = 2000,
): Promise<void> {
  let explorerBlock = 0;
  let nodeBlock = await getCurrentBlock();
  let i = 0;

  console.log(`🕓 FIRST Waiting for explorer to sync... ${i} ${explorerBlock}/${nodeBlock}`);

  while (explorerBlock < nodeBlock) {
    try {
      const { data } = await network({
        method: "GET",
        url,
      });
      explorerBlock = data?.height ?? 0;
    } catch (error) {
      console.error("❌ Error fetching explorer block:", error);
    }

    nodeBlock = await getCurrentBlock();
    console.log(`🔁 Waiting for explorer to sync... ${i} ${explorerBlock}/${nodeBlock}`);
    await sleep(pollInterval);
    if (i > 100) {
      throw new Error("Explorer sync timeout");
    }
    i++;
  }

  console.log(`✅ Explorer is synced at block ${explorerBlock}`);
}

export function findUtxo(account: BitcoinAccount, hash: string, index: number) {
  return account.bitcoinResources.utxos.find(
    utxo => utxo.hash === hash && utxo.outputIndex === index,
  );
}

// Utility to find UTXO that didn’t exist before (i.e., new change output)
export function findNewUtxo(previous: BitcoinAccount, current: BitcoinAccount) {
  const prevSet = new Set(previous.bitcoinResources.utxos.map(u => `${u.hash}:${u.outputIndex}`));
  return current.bitcoinResources.utxos.find(u => !prevSet.has(`${u.hash}:${u.outputIndex}`));
}

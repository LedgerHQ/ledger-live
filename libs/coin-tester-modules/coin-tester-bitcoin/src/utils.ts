import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { getCurrentBlock, getRawMempool } from "./helpers";
import network from "@ledgerhq/live-network/network";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForTxInMempool(txId: string, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const mempool = await getRawMempool();
    if (mempool.includes(txId)) return true;
    await sleep(500);
  }
  throw new Error(`Transaction ${txId} not found in mempool after ${timeout}ms`);
}

// The explorer (Atlas) of the coin-sandbox instance, known once it is up
let explorerUrl: string | undefined;

export function setExplorerUrl(url: string): void {
  explorerUrl = url;
}

export async function waitForExplorerSync(pollInterval: number = 2000): Promise<void> {
  if (explorerUrl === undefined) throw new Error("the explorer is not set: is the sandbox up?");
  const url = `${explorerUrl}/blockchain/v4/btc_regtest/block/current`;
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

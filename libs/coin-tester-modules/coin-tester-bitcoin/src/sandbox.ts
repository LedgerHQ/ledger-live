import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { getWalletAddress, loadWallet, setBitcoinRpc, WALLET } from "./helpers";
import { setExplorerUrl } from "./utils";

let sandbox: Sandbox | undefined;

/**
 * Asks coin-sandbox for a regtest bitcoind and Atlas, the explorer coin-bitcoin reads, and points
 * the helpers at them. The tester's wallet is funded by the sandbox airdrop, for the transactions
 * the node itself sends (RBF and cancel scenarios).
 */
export async function spawnSandbox(): Promise<{ sandbox: Sandbox; explorerUrl: string }> {
  sandbox = await startSandbox(
    { family: "bitcoin", network: "bitcoin_regtest" },
    {
      node: { provider: "bitcoin-core", version: "28.0" },
      indexer: { provider: "atlas", version: "2.38.16" },
    },
  );
  const { node, indexer } = sandbox.endpoints;
  if (node === undefined || indexer === undefined) {
    throw new Error("the sandbox instance has no node or indexer endpoint");
  }
  setBitcoinRpc(node);
  setExplorerUrl(indexer);

  await loadWallet(WALLET);
  // One UTXO per node-sent transaction: a replacement spends its whole input, so each RBF or
  // cancel scenario uses up one (the coinbases the scenarios mine are not mature)
  for (let i = 0; i < 4; i++) {
    await sandbox.airdrop(await getWalletAddress(), 5);
  }
  return { sandbox, explorerUrl: indexer };
}

export async function killSandbox(): Promise<void> {
  await sandbox?.down();
  sandbox = undefined;
}

import { toSimnetAddress } from "./addressUtils";
import { mineBlocks, waitForBalance, waitForTransactionCount } from "./kaspaNode";

// 1 KAS = 100_000_000 sompi; the simnet block reward is 50 KAS.
const BLOCK_REWARD_SOMPI = 50n * 100_000_000n;

// Each block is one coinbase transaction to the test address, so 600 blocks push its history past
// the indexer's 500-tx page: every sync has to walk more than one page (listOperations' `before`
// cursor on the generic adapter, the in-module `after` loop on legacy). 600 × 50 KAS = 30,000 KAS,
// far above what both strategy runs spend (each "Send max" moves at most 88 inputs).
export const SETUP_BLOCKS = 600;

// Mined after the setup blocks to advance the DAA score so every setup UTXO satisfies the
// 1000-block coinbase maturity period. Maturity is a chain-height/DAA-score rule, not a per-address
// one, so these go to `recipient` (never synced) instead of the test address: the wallet's balance
// counts immature coinbase UTXOs as spendable, so a 1000-block pile of them on the test address
// would make "Send max" target far more than the 88 mature inputs a transaction can carry.
export const MATURITY_GAP_BLOCKS = 1000;

// Mined back-to-back: measured locally, 1,600 blocks at 0 ms take ~4 s and the indexer's history
// catches up within a second (vs ~100 s at the former 50 ms). waitForTransactionCount below absorbs
// any lag, so speed never trades against a complete history.
const SETUP_MINE_INTERVAL_MS = 0;

/**
 * Fund the test address once for the whole Jest run (called from globalSetup, before any test file):
 * both strategy runs and negativeCases.test.ts share this chain state. Mining unconditionally here —
 * rather than per scenario, gated on a balance check — also rules out the LIVE-34179 failure where a
 * balance-based skip left only immature coinbase inputs for the first broadcast.
 */
export async function fundTestAddress(testAddress: string, recipient: string): Promise<void> {
  const sink = toSimnetAddress(recipient);
  await mineBlocks(SETUP_BLOCKS, SETUP_MINE_INTERVAL_MS, toSimnetAddress(testAddress));
  await mineBlocks(MATURITY_GAP_BLOCKS, SETUP_MINE_INTERVAL_MS, sink);

  // The REST balance comes from kaspad (getBalanceByAddress) while transaction history comes from
  // the indexer's database, so wait on both: the balance proves the node has the blocks, the count
  // proves the history listOperations reads is complete.
  await waitForBalance(testAddress, BigInt(SETUP_BLOCKS - 5) * BLOCK_REWARD_SOMPI, 300_000);
  // The indexer commits on new-block notifications. Right after `compose up` its block fetcher is
  // still waiting for kaspad to report synced, so blocks mined in that window sit uncommitted until
  // the next block arrives (then all of them commit at once). Nudge with one block to the sink —
  // not testAddress, whose history must stay exactly the setup blocks — until the history shows.
  await waitForTransactionCount(testAddress, SETUP_BLOCKS, 120_000, () => mineBlocks(1, 0, sink));
}

import { toSimnetAddress } from "./addressUtils";
import { mineBlocks, waitForBalance, waitForTransactionCount } from "./kaspaNode";
import { accountAddress, PURPOSES, STRATEGIES, type AccountPurpose } from "./testAccounts";

// 1 KAS = 100_000_000 sompi; the simnet block reward is 50 KAS.
export const BLOCK_REWARD_SOMPI = 50n * 100_000_000n;

// Each block is one coinbase transaction to the funded address, so 600 blocks push a history
// account past the indexer's 500-tx page: every sync has to walk more than one page
// (listOperations' `before` cursor on the generic adapter, the in-module `after` loop on legacy).
// 600 × 50 KAS = 30,000 KAS, far above what a run spends (each "Send max" moves at most 88 inputs).
export const SETUP_BLOCKS = 600;

// A drain account must hold no more UTXOs than one transaction can spend (MAX_UTXOS_PER_TX = 88),
// or "Send max" cannot empty it. 20 coinbase UTXOs × 50 KAS = 1,000 KAS.
export const DRAIN_BLOCKS = 20;

export const FUNDING_BLOCKS: Record<AccountPurpose, number> = {
  history: SETUP_BLOCKS,
  drain: DRAIN_BLOCKS,
};

// Mined after the funding blocks to advance the DAA score so every funding UTXO satisfies the
// 1000-block coinbase maturity period. Maturity is a chain-height/DAA-score rule, not a per-address
// one, so these go to `recipient` (never synced) instead of a test account: the wallet's balance
// counts immature coinbase UTXOs as spendable, so a 1000-block pile of them on a test account
// would make "Send max" target far more than the 88 mature inputs a transaction can carry.
export const MATURITY_GAP_BLOCKS = 1000;

// Mined back-to-back: measured locally, 1,600 blocks at 0 ms take ~4 s and the indexer's history
// catches up within a second (vs ~100 s at the former 50 ms). waitForTransactionCount below absorbs
// any lag, so speed never trades against a complete history.
const SETUP_MINE_INTERVAL_MS = 0;

/**
 * Fund every test account once for the whole Jest run (called from globalSetup, before any test
 * file): one history and one drain account per strategy, see testAccounts.ts. Mining unconditionally
 * here — rather than per scenario, gated on a balance check — also rules out the LIVE-34179 failure
 * where a balance-based skip left only immature coinbase inputs for the first broadcast.
 */
export async function fundTestAccounts(recipient: string): Promise<void> {
  const sink = toSimnetAddress(recipient);
  const funded: { address: string; blocks: number }[] = [];
  for (const purpose of PURPOSES) {
    for (const strategy of STRATEGIES) {
      const address = await accountAddress(purpose, strategy);
      const blocks = FUNDING_BLOCKS[purpose];
      await mineBlocks(blocks, SETUP_MINE_INTERVAL_MS, toSimnetAddress(address));
      funded.push({ address, blocks });
    }
  }
  await mineBlocks(MATURITY_GAP_BLOCKS, SETUP_MINE_INTERVAL_MS, sink);

  for (const { address, blocks } of funded) {
    // The REST balance comes from kaspad (getBalanceByAddress) while transaction history comes
    // from the indexer's database, so wait on both: the balance proves the node has the blocks,
    // the count proves the history listOperations reads is complete.
    await waitForBalance(address, BigInt(blocks - 5) * BLOCK_REWARD_SOMPI, 300_000);
    // The indexer commits on new-block notifications. Right after `compose up` its block fetcher
    // is still waiting for kaspad to report synced, so blocks mined in that window sit uncommitted
    // until the next block arrives (then all of them commit at once). Nudge with one block to the
    // sink — never a test account, whose history must stay exactly its funding — until it shows.
    await waitForTransactionCount(address, blocks, 120_000, () => mineBlocks(1, 0, sink));
  }
}

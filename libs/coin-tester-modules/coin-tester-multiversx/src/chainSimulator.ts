import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

/**
 * Local MultiversX Chain Simulator endpoint (gateway/proxy API + /simulator/* control endpoints).
 * The indexer (MSW) proxies the aggregator API the coin module expects onto this URL.
 */
export const SIMULATOR_URL = "http://localhost:8085";

const composeOptions = {
  cwd: path.resolve(__dirname, ".."),
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

/**
 * Spawn the chain simulator container. `compose up --wait` blocks until the
 * docker-compose healthcheck reports the node ready, so there is no in-process
 * readiness loop here.
 */
export async function spawnChainSimulator(): Promise<void> {
  console.log("Starting MultiversX chain simulator...");
  await compose.upOne("chain-simulator", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });
  console.log(chalk.bgBlueBright(" -  CHAIN SIMULATOR READY ✅  - "));
}

export async function killChainSimulator(): Promise<void> {
  console.log("Stopping MultiversX chain simulator...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

/** GET helper against the simulator gateway. Returns parsed JSON or null on failure. */
export async function simulatorGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SIMULATOR_URL}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** POST helper against the simulator. Returns parsed JSON. */
async function simulatorPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SIMULATOR_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await res.json()) as T;
}

/**
 * Generate `count` blocks on demand. Block production is otherwise frozen, so
 * this is how queued transactions get included.
 */
export async function generateBlocks(count = 1): Promise<void> {
  await simulatorPost(`/simulator/generate-blocks/${count}`);
}

/**
 * Advance blocks until the given epoch is reached. The ESDT system contract is
 * activation-epoch gated (disabled at genesis), so token issuance requires
 * advancing past epoch 0.
 */
export async function advanceToEpoch(epoch: number): Promise<void> {
  await simulatorPost(`/simulator/generate-blocks-until-epoch-reached/${epoch}`);
}

/**
 * Advance blocks until the given transaction is fully processed (deterministic inclusion).
 *
 * Bounded with a timeout so it can never hang the suite. If the simulator reports the tx
 * is still pending (e.g. cross-shard settlement needs more rounds) or the call times out,
 * we fall back to generating a batch of blocks; the scenario's sync-and-retry then confirms
 * the operation. This keeps a slow-to-settle tx from failing the run while still surfacing
 * genuinely stuck txs (they simply never appear and the scenario's retries exhaust).
 */
export async function generateBlocksUntilTxProcessed(txHash: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(
      `${SIMULATOR_URL}/simulator/generate-blocks-until-transaction-processed/${txHash}`,
      { method: "POST", signal: controller.signal },
    );
    const json = (await res.json()) as { error?: string; code?: string };
    if (json?.code === "successful") return;
  } catch {
    // timeout / network error — fall through to the block-batch fallback
  } finally {
    clearTimeout(timer);
  }
  // Fallback: push enough blocks to settle the tx (including cross-shard).
  await generateBlocks(6);
}

/**
 * State entry accepted by POST /simulator/set-state.
 * Credits an address with EGLD (and optionally ESDT balances) without a faucet.
 */
export interface SetStateEntry {
  address: string;
  nonce?: number;
  balance?: string;
  /**
   * Raw account storage (hex trie key -> hex value). The simulator applies these to
   * the account's data trie. NOTE: writing an ESDT balance key here is not sufficient
   * to make the gateway list the token — it must also be issued/registered in the ESDT
   * system contract. See README.
   */
  pairs?: Record<string, string>;
}

/** Directly set account state (balance/nonce/ESDT) — the deterministic way to fund test accounts. */
export async function setState(entries: SetStateEntry[]): Promise<void> {
  await simulatorPost("/simulator/set-state", entries);
  // set-state takes effect on the next generated block.
  await generateBlocks(1);
}

/** Convenience: fund an address with the given EGLD amount (in wei, 18 decimals). */
export async function fundAccount(address: string, balanceWei: string): Promise<void> {
  await setState([{ address, nonce: 0, balance: balanceWei }]);
}

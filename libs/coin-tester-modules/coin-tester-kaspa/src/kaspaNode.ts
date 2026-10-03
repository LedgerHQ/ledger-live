import path from "path";
import { upMany, down } from "docker-compose";

const COMPOSE_FILE = path.resolve(__dirname, "..", "docker-compose.yml");
const COMPOSE_CWD = path.resolve(__dirname, "..");

const REST_BASE = "http://localhost:8080";
const MINER_BASE = "http://localhost:3939";

// Stored so killKaspaNode() can tear down with the same env the stack started with.
let currentMiningAddress = "";

export async function spawnKaspaNode(miningAddress: string): Promise<void> {
  currentMiningAddress = miningAddress;
  await upMany(["kaspad", "kaspa-db", "kaspa-indexer", "kaspa-rest", "kaspa-miner"], {
    cwd: COMPOSE_CWD,
    config: COMPOSE_FILE,
    log: true,
    env: {
      ...process.env,
      KASPA_MINING_ADDRESS: miningAddress,
    },
    // --build: kaspa-miner is built from a local Dockerfile, not pulled from a registry.
    // `docker compose down` (teardown, see killKaspaNode below) removes containers/networks but
    // NOT images, so a stale cached image silently survives across runs and local miner.js edits
    // never take effect without forcing a rebuild here.
    commandOptions: ["--wait", "--build"],
  });
}

// Mine exactly `count` blocks via the persistent miner HTTP server.
// `intervalMs` controls the delay between blocks inside the miner — set to ~50ms during
// setup to keep the indexer's virtual chain processor in live mode (~1ms/block) instead
// of triggering a slow historical resync (~240ms/block).
// `payAddress` overrides the container's default KASPA_MINING_ADDRESS for these blocks only —
// used to send coinbase-maturity confirmation blocks to a throwaway address instead of the
// wallet's own test address, so they don't inflate its transaction history.
export async function mineBlocks(
  count: number,
  intervalMs = 0,
  payAddress?: string,
): Promise<void> {
  const res = await fetch(`${MINER_BASE}/mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, intervalMs, payAddress }),
  });
  if (!res.ok) {
    throw new Error(`mineBlocks failed (${res.status}): ${await res.text()}`);
  }
}

export async function killKaspaNode(): Promise<void> {
  await down({
    cwd: COMPOSE_CWD,
    config: COMPOSE_FILE,
    log: true,
    env: { ...process.env, KASPA_MINING_ADDRESS: currentMiningAddress || "" },
    commandOptions: ["--volumes", "--remove-orphans"],
  });
}

export async function getBalance(address: string): Promise<bigint> {
  try {
    const res = await fetch(`${REST_BASE}/addresses/${address}/balance`);
    if (res.ok) {
      const data = (await res.json()) as { address: string; balance: number };
      return BigInt(data.balance);
    }
  } catch {}
  return 0n;
}

// Number of txs in the address's indexed history (the indexer's database, not kaspad), or -1 while
// the REST server can't answer yet.
export async function getTransactionCount(address: string): Promise<number> {
  try {
    const res = await fetch(`${REST_BASE}/addresses/${address}/transactions-count`);
    if (res.ok) return ((await res.json()) as { total: number }).total;
  } catch {
    // REST server not yet ready
  }
  return -1;
}

// Poll the indexer until the address's transaction history holds at least `minCount` txs. Unlike
// the balance (served from kaspad's UTXO index), this is the history listOperations pages through.
// `nudge` runs between polls; see chainSetup.ts for why the indexer may need one.
export async function waitForTransactionCount(
  address: string,
  minCount: number,
  timeoutMs = 120_000,
  nudge?: () => Promise<void>,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await getTransactionCount(address)) >= minCount) return;
    await nudge?.();
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }
  throw new Error(`waitForTransactionCount timed out after ${timeoutMs}ms for ${address}`);
}

// Poll the REST server until the address balance >= minSompi or the timeout elapses.
// The balance comes from kaspad, so it does not prove the indexer's history has caught up.
export async function waitForBalance(
  address: string,
  minSompi: bigint,
  timeoutMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await getBalance(address)) >= minSompi) return;
    } catch {
      // REST server not yet ready — keep polling
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`waitForBalance timed out after ${timeoutMs}ms for ${address}`);
}

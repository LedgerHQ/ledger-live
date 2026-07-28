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
    commandOptions: ["--wait"],
  });
}

// Mine exactly `count` blocks via the persistent miner HTTP server.
// `intervalMs` controls the delay between blocks inside the miner — set to ~50ms during
// setup to keep the indexer's virtual chain processor in live mode (~1ms/block) instead
// of triggering a slow historical resync (~240ms/block).
export async function mineBlocks(count: number, intervalMs = 0): Promise<void> {
  const res = await fetch(`${MINER_BASE}/mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, intervalMs }),
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

// Poll the REST server until the address balance >= minSompi or the timeout elapses.
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

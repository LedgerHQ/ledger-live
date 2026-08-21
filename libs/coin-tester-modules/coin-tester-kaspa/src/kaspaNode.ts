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
  // Diagnostic: kaspad can silently reject a submitted block (stale template race — see
  // miner.js) without the HTTP call itself failing, so "requested count" and "actually
  // accepted" can diverge. Logged unconditionally to investigate a CI-only maturity failure
  // (LIVE-34179) that hasn't reproduced locally, including under artificial CPU/memory limits.
  const body = (await res.json()) as {
    mined: number;
    accepted: number;
    rejected: number;
    rejectionSamples: string[];
  };
  console.log(
    `mineBlocks(count=${count}, payAddress=${payAddress ?? "<default>"}) -> accepted=${body.accepted} rejected=${body.rejected}` +
      (body.rejectionSamples.length ? ` samples=${JSON.stringify(body.rejectionSamples)}` : ""),
  );
}

// Diagnostic: real current chain height/DAA score from the REST server, to check whether
// mineBlocks() requests actually advanced the chain as far as expected.
export async function getVirtualDaaScore(): Promise<string> {
  const res = await fetch(`${REST_BASE}/info/blockdag`);
  const data = (await res.json()) as { virtualDaaScore: string };
  return data.virtualDaaScore;
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

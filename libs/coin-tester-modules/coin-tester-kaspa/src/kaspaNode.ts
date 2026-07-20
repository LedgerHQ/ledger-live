import path from "path";
import { upAll, down } from "docker-compose";

const COMPOSE_FILE = path.resolve(__dirname, "..", "docker-compose.yml");
const COMPOSE_CWD = path.resolve(__dirname, "..");

// Local kaspa-rest-server base URL (set by env.setup.ts before module eval)
const REST_BASE = "http://localhost:8080";

export async function spawnKaspaNode(miningAddress: string): Promise<void> {
  await upAll({
    cwd: COMPOSE_CWD,
    config: COMPOSE_FILE,
    log: true,
    env: {
      ...process.env,
      KASPA_MINING_ADDRESS: miningAddress,
    },
    commandOptions: ["--wait"], // docker compose v2: wait for healthchecks
  });
}

export async function killKaspaNode(): Promise<void> {
  await down({
    cwd: COMPOSE_CWD,
    config: COMPOSE_FILE,
    log: true,
    // Pass a placeholder so docker-compose doesn't warn about the unset variable
    // when parsing the yml during teardown (the value is irrelevant for `down`).
    env: { ...process.env, KASPA_MINING_ADDRESS: process.env.KASPA_MINING_ADDRESS ?? "" },
    commandOptions: ["--volumes", "--remove-orphans"],
  });
}

// Poll the REST server until the address balance >= minSompi or the timeout elapses.
// Endpoint: GET /addresses/{address}/balance → { address: string, balance: number }
// (kaspa-rest-server source: get_balance.py BalanceResponse, balance is an integer)
export async function waitForBalance(
  address: string,
  minSompi: bigint,
  timeoutMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${REST_BASE}/addresses/${address}/balance`);
      if (res.ok) {
        const data = (await res.json()) as { address: string; balance: number };
        if (BigInt(data.balance) >= minSompi) return;
      }
    } catch {
      // REST server not yet ready — keep polling
    }
    await new Promise(resolve => setTimeout(resolve, 2_000));
  }
  throw new Error(`waitForBalance timed out after ${timeoutMs}ms for ${address}`);
}

// Poll until the address has at least `minUtxoCount` UTXOs (needed for multi-UTXO scenario).
// Each coinbase reward produces one UTXO so mining enough blocks fills this automatically.
//
// Uses POST /addresses/utxos (same endpoint as coin-kaspa's getUtxosForAddresses), NOT the GET
// variant. The GET /addresses/{address}/utxos filters results by address string equality:
// in simnet kaspad returns kaspasim: addresses while coin-kaspa queries with kaspa: addresses,
// so the GET filter removes all entries. The POST endpoint returns UTXOs unfiltered.
export async function waitForUtxos(
  address: string,
  minUtxoCount: number,
  timeoutMs = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${REST_BASE}/addresses/utxos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: [address] }),
      });
      if (res.ok) {
        const data = (await res.json()) as unknown[];
        if (data.length >= minUtxoCount) return;
      }
    } catch {
      // keep polling
    }
    await new Promise(resolve => setTimeout(resolve, 2_000));
  }
  throw new Error(`waitForUtxos timed out after ${timeoutMs}ms for ${address}`);
}

// Coinbase maturity in simnet is 1000 blocks. Poll until at least minCount UTXOs are either
// non-coinbase or old enough (currentDaaScore - blockDaaScore >= 1000) to be spendable.
export async function waitForMatureUtxos(
  address: string,
  minCount: number,
  timeoutMs = 1_800_000,
): Promise<void> {
  const MATURITY_PERIOD = 1000;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const [dagRes, utxoRes] = await Promise.all([
        fetch(`${REST_BASE}/info/blockdag`),
        fetch(`${REST_BASE}/addresses/utxos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: [address] }),
        }),
      ]);
      if (dagRes.ok && utxoRes.ok) {
        const dag = (await dagRes.json()) as { virtualDaaScore: string };
        const utxos = (await utxoRes.json()) as Array<{
          utxoEntry: { blockDaaScore: string };
        }>;
        const currentDaa = Number(dag.virtualDaaScore);
        // Apply maturity check to all UTXOs regardless of isCoinbase flag.
        // In simnet all test UTXOs are coinbase; applying the check universally is safe.
        const matureCount = utxos.filter(
          u => currentDaa - Number(u.utxoEntry.blockDaaScore) >= MATURITY_PERIOD,
        ).length;
        if (matureCount >= minCount) return;
      }
    } catch {
      // keep polling
    }
    await new Promise(resolve => setTimeout(resolve, 2_000));
  }
  throw new Error(`waitForMatureUtxos timed out after ${timeoutMs}ms for ${address}`);
}

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { utils, type Account } from "near-api-js";
import { NETWORK_ID, POOL_BALANCE, POOL_ID } from "./fixtures";
import type { SandboxHandle } from "./sandbox";

// Pinned to a commit (not `master`) and checked against its digest, so it can't change under the scenario.
const WASM_COMMIT = "1720c0cfee238974ebeae8ad43076abeb951504f";
const WASM_URL = `https://raw.githubusercontent.com/near/core-contracts/${WASM_COMMIT}/staking-pool/res/staking_pool.wasm`;
const WASM_SHA256 = "454cf4a54ff49a1b144e2591eb4ec833bf3ab5fa4792128beb6d9d0cc8d76e58";

const CACHE_DIR = join(__dirname, "..", ".cache");
const WASM_PATH = join(CACHE_DIR, "staking_pool.wasm");

const TGAS = 1_000_000_000_000n;

const digestOf = (wasm: Buffer): string => createHash("sha256").update(wasm).digest("hex");

async function stakingPoolWasm(): Promise<Buffer> {
  if (existsSync(WASM_PATH)) {
    const cached = await readFile(WASM_PATH);
    if (digestOf(cached) === WASM_SHA256) {
      return cached;
    }
  }

  const response = await fetch(WASM_URL);
  if (!response.ok) {
    throw new Error(`coin-tester-near: cannot download staking_pool.wasm (${response.status})`);
  }

  const wasm = Buffer.from(await response.arrayBuffer());
  const digest = digestOf(wasm);
  if (digest !== WASM_SHA256) {
    throw new Error(
      `coin-tester-near: staking_pool.wasm digest mismatch, expected ${WASM_SHA256}, got ${digest}`,
    );
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(WASM_PATH, wasm);
  return wasm;
}

// Deploys a staking pool the scenario can delegate to. It logs a harmless `minimum_stake` failure
// every epoch since it holds far less than the validator seat price; getValidators is stubbed anyway.
export async function deployStakingPool(sandbox: SandboxHandle): Promise<Account> {
  const keyPair = utils.KeyPair.fromRandom("ed25519");
  await sandbox.keyStore.setKey(NETWORK_ID, POOL_ID, keyPair);
  await sandbox.root.createAccount(POOL_ID, keyPair.getPublicKey(), POOL_BALANCE);

  const pool = await sandbox.near.account(POOL_ID);
  await pool.deployContract(await stakingPoolWasm());

  await pool.functionCall({
    contractId: POOL_ID,
    methodName: "new",
    args: {
      owner_id: sandbox.root.accountId,
      stake_public_key: keyPair.getPublicKey().toString(),
      reward_fee_fraction: { numerator: 10, denominator: 100 },
    },
    gas: 300n * TGAS,
  });

  return pool;
}

/** Nudges the pool to settle rewards, which is what refreshes an account's unlock epoch. */
export async function pingPool(account: Account): Promise<void> {
  await account.functionCall({
    contractId: POOL_ID,
    methodName: "ping",
    args: {},
    gas: 125n * TGAS,
  });
}

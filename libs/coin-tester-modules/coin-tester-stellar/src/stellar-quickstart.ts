import chalk from "chalk";
import * as compose from "docker-compose";
import { FRIENDBOT_URL } from "./fixtures";

const composeOptions = {
  cwd: __dirname,
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

/**
 * Spawn Stellar Quickstart via docker-compose. `compose up --wait` blocks
 * until the container reports `healthy`, and the healthcheck in
 * docker-compose.yml is wired to probe both Horizon and Friendbot — so when
 * this function returns, the node is fully usable. No in-process readiness
 * polling required.
 */
export async function spawnStellarQuickstart(): Promise<void> {
  console.log("Starting Stellar Quickstart...");
  await compose.upOne("stellar", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });
  console.log(chalk.bgBlueBright(" -  STELLAR QUICKSTART READY ✅  - "));
}

export async function killStellarQuickstart(): Promise<void> {
  console.log("Stopping Stellar Quickstart...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

/**
 * Friendbot funds an account with 10 000 XLM. The call is synchronous —
 * Friendbot only returns once the funding transaction has closed in a ledger,
 * so the caller can read the funded balance immediately after.
 */
export async function fundViaFriendbot(address: string): Promise<{ hash: string }> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Friendbot funding failed for ${address}: ${res.status} ${detail}`);
  }
  const body = (await res.json()) as { hash?: string };
  if (!body.hash) {
    throw new Error(`Friendbot response missing tx hash for ${address}`);
  }
  return { hash: body.hash };
}

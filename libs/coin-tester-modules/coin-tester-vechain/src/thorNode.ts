import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

export const THOR_SOLO_RPC = "http://127.0.0.1:8669";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

export async function spawnThorNode(): Promise<void> {
  console.log("Starting vechain/thor solo…");
  await compose.upOne("thor-solo", { ...composeOpts(), commandOptions: ["--wait"] });
  console.log(chalk.bgBlueBright(" -  THOR SOLO READY ✅  - "));
}

export async function killThorNode(): Promise<void> {
  console.log("Stopping vechain/thor solo…");
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}

/**
 * Poll Thor's REST API (`GET /blocks/best`, see `@ledgerhq/coin-vechain/network/sdk`) until it
 * answers, then return the node's genesis chainTag — the last byte of the genesis block id
 * (`GET /blocks/0`), i.e. the value every signed transaction must embed to be accepted (see
 * `scenarii/vechain.ts` setup, which injects it via `LiveConfig`).
 */
export async function waitForThorReady(): Promise<number> {
  const deadline = Date.now() + 60_000;
  let lastError = "polling never started";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${THOR_SOLO_RPC}/blocks/best`);
      if (res.ok) {
        const genesisRes = await fetch(`${THOR_SOLO_RPC}/blocks/0`);
        const genesis = (await genesisRes.json()) as { id: string };
        return parseInt(genesis.id.slice(-2), 16);
      }
      lastError = `/blocks/best → ${res.status}`;
    } catch (err) {
      lastError = String(err);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`waitForThorReady timed out: ${lastError}`);
}

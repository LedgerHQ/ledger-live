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

// The node's genesis chainTag (last byte of the genesis block id, `GET /blocks/0`) — the value
// every signed transaction must embed to be accepted (see `scenarii/vechain.ts` setup, which
// injects it via `LiveConfig`). No readiness polling: `spawnThorNode`'s `--wait` already blocks
// until the compose healthcheck passes.
export async function readGenesisChainTag(): Promise<number> {
  const res = await fetch(`${THOR_SOLO_RPC}/blocks/0`);
  const genesis = (await res.json()) as { id: string };
  return parseInt(genesis.id.slice(-2), 16);
}

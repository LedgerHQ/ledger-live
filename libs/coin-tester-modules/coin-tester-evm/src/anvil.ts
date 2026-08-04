import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import { COIN_TESTER_EVM_MNEMONIC } from "./signer";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
export const spawnAnvilFork = async (rpc: string, forkBlockNumber?: number): Promise<void> => {
  await compose.upOne("anvil", {
    cwd: PACKAGE_ROOT,
    log: Boolean(process.env.DEBUG),
    config: ["docker-compose.prepare.yml"],
    env: {
      ...process.env,
      RPC: rpc,
      FORK_BLOCK_OPT:
        typeof forkBlockNumber === "number" ? `--fork-block-number ${forkBlockNumber}` : "",
      SEED: COIN_TESTER_EVM_MNEMONIC,
    },
    commandOptions: ["--wait"],
  });
};

export const spawnAnvil = async (chain: string): Promise<void> => {
  console.log("Starting anvil...");
  await compose.upOne("anvil", {
    cwd: PACKAGE_ROOT,
    log: Boolean(process.env.DEBUG),
    env: {
      ...process.env,
      CHAIN: chain,
      SEED: COIN_TESTER_EVM_MNEMONIC,
    },
    commandOptions: ["--wait"],
  });
  console.log(chalk.bgBlueBright(" -  ANVIL READY ✅  - "));
};

export const killAnvil = async (): Promise<void> => {
  console.log("Stopping anvil...");
  await compose.down({
    cwd: PACKAGE_ROOT,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killAnvil().catch(() => {});
  }),
);

import chalk from "chalk";
import * as compose from "docker-compose";

export const spawnAnvil = async (
  rpc: string,
  seed: string,
  forkBlockNumber?: number,
): Promise<void> => {
  console.log("Starting anvil...");
  await compose.upOne("anvil", {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: {
      ...process.env,
      RPC: rpc,
      SEED: seed,
      FORK_BLOCK_OPT:
        typeof forkBlockNumber === "number" ? `--fork-block-number ${forkBlockNumber}` : "",
    },
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  ANVIL READY ✅  - "));
};

export const killAnvil = async (): Promise<void> => {
  console.log("Stopping anvil...");
  await compose.down({
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killAnvil();
  }),
);

import chalk from "chalk";
import * as compose from "docker-compose";
import { killSpeculos, delay, ensureEnv } from "@ledgerhq/coin-tester/lib/signers/speculos";

const cwd = `${__dirname}/docker`;

export const spawnAtlas = async (): Promise<void> => {
  ensureEnv();
  console.log("Starting atlas...");
  await compose.upAll({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: {
      ...process.env,
    },
  });

  const checkAtlasLogs = async (): Promise<void> => {
    const { out } = await compose.logs("atlas", {
      cwd,
      env: {
        ...process.env,
      },
    });

    if (out.includes("Started Atlas Bitcoin")) {
      console.log(chalk.bgBlueBright(" -  ATLAS READY ✅  - "));
      return;
    }

    await delay(200);
    return checkAtlasLogs();
  };

  await checkAtlasLogs();
};

export const killAtlas = async (): Promise<void> => {
  console.log("Stopping atlas...");
  await compose.down({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "-v"],
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killAtlas(), killSpeculos()]);
  }),
);

import chalk from "chalk";
import * as compose from "docker-compose";
import { killSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";

const cwd = __dirname;

const delay = (timing: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timing));

const ensureEnv = () => {
  const mandatory_env_variables = ["SEED", "GH_TOKEN"];

  if (!mandatory_env_variables.every(variable => !!process.env[variable])) {
    throw new Error(
      `Missing env variables. Make sure that ${mandatory_env_variables.join(",")} are in your .env`,
    );
  }
};

export const spawnAnvil = async (rpc: string): Promise<void> => {
  ensureEnv();
  console.log("Starting anvil...");
  await compose.upOne("anvil", {
    cwd,
    log: Boolean(process.env.DEBUG),
    env: {
      ...process.env,
      RPC: rpc,
    },
  });

  const checkAnvilLogs = async (): Promise<void> => {
    const { out } = await compose.logs("anvil", {
      cwd,
      env: {
        ...process.env,
        RPC: rpc,
      },
    });

    if (out.includes("Listening on 0.0.0.0:")) {
      console.log(chalk.bgBlueBright(" -  ANVIL READY ✅  - "));
      return;
    }

    await delay(200);
    return checkAnvilLogs();
  };

  await checkAnvilLogs();
};

export const killAnvil = async (): Promise<void> => {
  console.log("Stopping anvil...");
  await compose.down({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killAnvil(), killSpeculos()]);
  }),
);

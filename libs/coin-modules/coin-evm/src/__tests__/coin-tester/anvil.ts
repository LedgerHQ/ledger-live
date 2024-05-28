import { v2 as compose } from "docker-compose";
import chalk from "chalk";
import { killSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";

const cwd = __dirname;

const delay = (timing: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timing));

export const spawnAnvil = async (rpc: string): Promise<void> => {
  console.log("Starting anvil...");
  await compose.upOne("anvil", {
    cwd,
    log: true,
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
    log: true,
    env: process.env,
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killAnvil(), killSpeculos()]);
  }),
);

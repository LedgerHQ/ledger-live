import "dotenv/config";
import path from "path";
import { v2 as compose } from "docker-compose";

const cwd = path.join(__dirname);

export const spawnAnvil = async (rpc = "https://rpc.ankr.com/eth"): Promise<void> => {
  await compose.upOne("anvil", {
    cwd,
    log: true,
    env: {
      ...process.env,
      RPC: rpc,
    },
  });
};

export const killDocker = async () => {
  await compose.stop({ cwd, log: true });
  await compose.rm({ cwd, log: true });
};

["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killDocker();
  }),
);

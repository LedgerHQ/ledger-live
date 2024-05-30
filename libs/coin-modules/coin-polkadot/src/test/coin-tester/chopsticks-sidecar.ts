import chalk from "chalk";
import { v2 as compose } from "docker-compose";

const cwd = __dirname;
const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));

const ensureEnv = () => {
  // SEED passed in scenarios
  const mandatory_env_variables = ["SEED"];

  if (!mandatory_env_variables.every(variable => !!process.env[variable])) {
    throw new Error(
      `Missing env variables. Make sure that ${mandatory_env_variables.join(",")} are in your .env`,
    );
  }
};

export async function spawnChopsticksAndSidecar() {
  ensureEnv();
  console.log("Starting chopsticks and sidecar...");

  await compose.upAll({
    cwd,
    log: true,
    env: process.env,
  });

  async function checkChopsticksLogs(has_started_max_retry = 20) {
    if (has_started_max_retry === 0) {
      throw new Error("Failed to start chopsticks container. Check possible logs.");
    }

    const { out } = await compose.logs(["chopsticks", "sidecar-api"], { cwd });

    if (out.includes("listening on port 8000")) {
      console.log(chalk.bgBlueBright(" -  Chopsticks READY ✅  - "));
      return;
    }

    console.log("Waiting for chopsticks to start...");
    await delay(3 * 1000); // 3 seconds

    return checkChopsticksLogs(has_started_max_retry - 1);
  }

  await checkChopsticksLogs();
}

export const killChopsticksAndSidecar = async (): Promise<void> => {
  console.log("Stopping anvil...");
  await compose.down({
    cwd,
    log: true,
    env: process.env,
  });
};

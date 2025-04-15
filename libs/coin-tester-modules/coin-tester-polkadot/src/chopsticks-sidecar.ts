import chalk from "chalk";
import * as compose from "docker-compose";

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
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });

  let chopsticksStarted = false;
  let sidecarStarted = false;
  async function checkChopsticksLogs(maxRetries = 50) {
    if (maxRetries === 0) {
      throw new Error("Failed to start chopsticks and/or sidecar container(s)");
    }

    const [{ out: outChopsticks }, { out: outSidecar }] = await Promise.all([
      compose.logs("chopsticks", { cwd }),
      compose.logs("sidecar-api", { cwd }),
    ]);

    if (!chopsticksStarted && outChopsticks.includes("listening on http://[::]:8000")) {
      console.log(chalk.bgBlueBright(" -  CHOPSTICKS READY ✅  - "));
      chopsticksStarted = true;
    }
    if (!sidecarStarted && outSidecar.includes("Listening on http://0.0.0.0:8080/")) {
      console.log(chalk.bgRedBright(" -  SIDECAR READY ✅  - "));
      sidecarStarted = true;
    }
    if (chopsticksStarted && sidecarStarted) return;

    await delay(200);
    return checkChopsticksLogs(maxRetries - 1);
  }

  await checkChopsticksLogs();
}

export const killChopsticksAndSidecar = async (): Promise<void> => {
  console.log("Stopping chopsticks...");
  await compose.down({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });
};

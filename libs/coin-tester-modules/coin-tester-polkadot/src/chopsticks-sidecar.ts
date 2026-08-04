import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const COMPOSE_DIR = path.join(__dirname, "..");

function composeConfig() {
  return process.env.COIN_TESTER_PREPARE ? ["docker-compose.prepare.yml"] : undefined;
}

export async function spawnChopsticksAndSidecar(chopsticksConfig: string): Promise<void> {
  console.log("Starting chopsticks and sidecar...");
  await compose.upAll({
    cwd: COMPOSE_DIR,
    config: composeConfig(),
    log: Boolean(process.env.DEBUG),
    env: { ...process.env, CHOPSTICKS_CONFIG: chopsticksConfig },
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  CHOPSTICKS READY ✅  - "));
  console.log(chalk.bgRedBright(" -  SIDECAR READY ✅  - "));
}

export const killChopsticksAndSidecar = async (): Promise<void> => {
  console.log("Stopping chopsticks...");
  await compose.down({
    cwd: COMPOSE_DIR,
    config: composeConfig(),
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });
};

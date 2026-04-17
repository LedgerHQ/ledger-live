import chalk from "chalk";
import * as compose from "docker-compose";

export async function spawnChopsticksAndSidecar(chopsticksConfig: string): Promise<void> {
  console.log("Starting chopsticks and sidecar...");
  await compose.upAll({
    cwd: __dirname,
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
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });
};

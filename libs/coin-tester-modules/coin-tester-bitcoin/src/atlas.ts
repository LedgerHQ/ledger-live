import chalk from "chalk";
import * as compose from "docker-compose";

export const spawnAtlas = async (): Promise<void> => {
  console.log("Starting atlas...");
  await compose.upAll({
    cwd: `${__dirname}/docker`,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  ATLAS READY ✅  - "));
};

export const killAtlas = async (): Promise<void> => {
  console.log("Stopping atlas...");
  await compose.down({
    cwd: `${__dirname}/docker`,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
};

const processOn = process.on.bind(process) as (
  event: string,
  listener: () => void,
) => typeof process;
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e => {
  processOn(e, () => {
    void killAtlas();
  });
});

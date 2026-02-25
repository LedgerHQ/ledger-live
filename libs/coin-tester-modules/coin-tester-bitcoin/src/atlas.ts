import chalk from "chalk";
import * as compose from "docker-compose";

const cwd = `${__dirname}/docker`;

const delay = (timing: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timing));

export const spawnAtlas = async (): Promise<void> => {
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
    await killAtlas();
  }),
);

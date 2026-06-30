import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

// Single-validator Cosmos Hub devnet. Its own compose file so it stays
// independent of the (two-validator) babylond devnet; the two scenarios run
// sequentially, each spinning its chain up and tearing it down.
const composeOptions = {
  cwd: PACKAGE_ROOT,
  config: "docker-compose.gaia.yml",
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

export async function spawnGaiad(): Promise<void> {
  console.log("Starting gaiad...");
  await compose.upAll({
    ...composeOptions,
    commandOptions: ["--wait", "--build"],
  });
  console.log(chalk.bgBlueBright(" -  GAIAD READY ✅  - "));
}

export async function killGaiad(): Promise<void> {
  console.log("Stopping gaiad...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

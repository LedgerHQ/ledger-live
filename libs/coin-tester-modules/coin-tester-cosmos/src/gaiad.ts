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
    // `--remove-orphans` sweeps a sibling devnet container left behind by an
    // interrupted run: the three compose files share one compose project
    // (the directory name) and all bind 1317/26657/9090, so a leaked
    // container from another scenario would otherwise still hold the ports
    // and this `up` would fail with "port is already allocated".
    commandOptions: ["--wait", "--build", "--remove-orphans"],
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

import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

// docker-compose.yml + babylond.Dockerfile live at the package root, one level
// up from this file in src/. compose resolves the compose file and its build
// context relative to cwd, so cwd must be the package root (same pattern as
// coin-tester-tron). Using __dirname would look in src/ and fail to start.
const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOptions = {
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

export async function spawnBabylond(): Promise<void> {
  console.log("Starting babylond...");
  // `--build` keeps the image in sync with babylond.Dockerfile + entrypoint.sh
  // edits. Docker's layer cache makes this near-instant when nothing changed;
  // without it, a stale image silently runs the previous entrypoint against a
  // fresh genesis (e.g. wrong denom / missing dev account → the scenario fails
  // confusingly instead of at the build).
  await compose.upAll({
    ...composeOptions,
    commandOptions: ["--wait", "--build"],
  });
  console.log(chalk.bgBlueBright(" -  BABYLOND READY ✅  - "));
}

export async function killBabylond(): Promise<void> {
  console.log("Stopping babylond...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

try {
  cd(path.join(__dirname, ".."));

  await rimraf(["src/data/flags/react", "src/data/flags/reactNative"]);

  await $`zx ./scripts/sync-families-dispatch.mjs`;

  await $`node ./scripts/buildReactFlags.js`;

  await $`pnpm tsc --project src/tsconfig.json --watch`;
} catch (error) {
  console.log(chalk.red(error));
  process.exit(1);
}

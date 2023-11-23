#!/usr/bin/env zx
import "zx/globals";

try {
  cd(path.join(__dirname, ".."));

  await $`zx ./scripts/sync-families-dispatch.mjs`;

  await $`pnpm tsc --project src/tsconfig.json --watch`;
} catch (error) {
  console.log(chalk.red(error));
  process.exit(1);
}

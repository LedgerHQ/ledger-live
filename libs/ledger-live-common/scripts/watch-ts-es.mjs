#!/usr/bin/env zx
import "zx/globals";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

try {
  cd(path.join(__dirname, ".."));

  await $`zx ./scripts/sync-families-dispatch.mjs`;

  await $`pnpm tsc --project src/tsconfig.build.json -m esnext --moduleResolution bundler --outDir lib-es --watch`;
} catch (error) {
  console.log(chalk.red(error));
  process.exit(1);
}

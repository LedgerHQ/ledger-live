#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

try {
  cd(path.join(__dirname, ".."));

  const remover = async () => {
    await new Promise((resolve, reject) =>
      rimraf("src/data/icons/react*", (e) => {
        if (e) {
          echo(chalk.red(e));
          return reject(e);
        }
        resolve();
      })
    );
  };

  await remover();

  await $`zx ./scripts/sync-families-dispatch.mjs`;

  await $`node ./scripts/buildReactIcons.js`;
  await $`node ./scripts/buildReactFlags.js`;

  await $`pnpm tsc --project src/tsconfig.json --watch`;
} catch (error) {
  console.log(chalk.red(error));
  process.exit(1);
}

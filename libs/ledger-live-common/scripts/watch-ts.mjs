#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

const remover = async () => {
  await rimraf("src/data/icons/react*", (e) => {
    if (e) echo(chalk.red(e));
  });
};

await remover();

await $`zx ./scripts/sync-families-dispatch.mjs`;

await $`node ./scripts/buildReactIcons.js`;
await $`node ./scripts/buildReactFlags.js`;

await $`pnpm tsc --project src/tsconfig.json --watch`;

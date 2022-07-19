#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

const remover = async () => {
  await rimraf("lib", (e) => {
    if (e) echo(chalk.red(e));
  });
  await rimraf("src/data/icons/react*", (e) => {
    if (e) echo(chalk.red(e));
  });
};

await remover();

await $`zx ./scripts/sync-families-dispatch.mjs`;

await $`node ./scripts/buildReactIcons.js`;
await $`node ./scripts/buildReactFlags.js`;

const prefix = $.prefix;

within(async () => {
  $.prefix = prefix;
  await $`NODE_ENV=production pnpm tsc --project src/tsconfig.json`;
});

within(async () => {
  $.prefix = prefix;
  await $`NODE_ENV=production pnpm tsc --project src/tsconfig.json -m ES6 --outDir lib-es`;
});

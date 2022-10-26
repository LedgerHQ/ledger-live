#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

const promisifiedRimraf = (path) => {
  return new Promise((resolve, reject) =>
    rimraf(path, (e) => {
      if (e) {
        echo(chalk.red(e));
        return reject(e);
      }
      resolve();
    })
  );
};

await Promise.all([
  promisifiedRimraf("lib"),
  promisifiedRimraf("src/data/icons/react*"),
]);

await $`zx ./scripts/sync-families-dispatch.mjs`;

await $`node ./scripts/buildReactIcons.js`;
await $`node ./scripts/buildReactFlags.js`;

const prefix = $.prefix;

await within(async () => {
  $.prefix = prefix;
  process.env.NODE_ENV = "production";
  await $`pnpm tsc --project src/tsconfig.json`;
  await $`pnpm tsc --project src/tsconfig.json -m ES6 --outDir lib-es`;
});
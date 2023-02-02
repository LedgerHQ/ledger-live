#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

if (!process.env.CI) {
  await rimraf([
    "lib",
    "src/data/icons/react",
    "src/data/icons/reactNative",
    "src/data/flags/react",
    "src/data/flags/reactNative",
  ]);
}

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

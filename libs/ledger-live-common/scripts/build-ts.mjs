#!/usr/bin/env zx
import rimraf from "rimraf";
import "zx/globals";

$.verbose = true;

if (os.platform() === "win32") {
  usePowerShell();
}

cd(path.join(__dirname, ".."));

if (!process.env.CI) {
  await rimraf(["lib"]);
}

await $`zx ./scripts/sync-families-dispatch.mjs`;

const prefix = $.prefix;

await within(async () => {
  $.prefix = prefix;
  process.env.NODE_ENV = "production";
  await $`pnpm tsc --project src/tsconfig.json`;
  await $`pnpm tsc --project src/tsconfig.json -m ES6 --outDir lib-es`;
});

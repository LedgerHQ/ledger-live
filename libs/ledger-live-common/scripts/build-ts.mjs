#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

$.verbose = true; // everything works like in v7

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
  await $`pnpm tsc --project src/tsconfig.build.json`;
  await $`pnpm tsc --project src/tsconfig.build.json -m esnext --moduleResolution bundler --outDir lib-es`;
});

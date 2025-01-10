#!/usr/bin/env zx
/* eslint-disable no-undef */
import "zx/globals";

import * as esbuild from "esbuild";

const config = {
  entryPoints: ["src/**/*"],
  minify: true,
  bundle: false,
  treeShaking: true,
  sourcemap: true,
  color: true,
  loader: {
    ".json": "copy",
  },
};

const buildEsm = async () => {
  console.log(chalk.blue("Building esm..."));
  await esbuild.build({
    ...config,
    outdir: "lib/esm",
    format: "esm",
    platform: "browser",
    plugins: [
      {
        name: "copy-package-json",
        setup(build) {
          build.onEnd(async () => {
            await $`cp package.json lib/esm/package.json`;
          });
        },
      },
    ],
  });
};

const buildCjs = async () => {
  console.log(chalk.blue("Building cjs..."));
  await esbuild.build({
    ...config,
    outdir: "lib/cjs",
    format: "cjs",
    platform: "node",
    plugins: [
      {
        name: "copy-package-json",
        setup(build) {
          build.onEnd(async () => {
            await $`cp package.json lib/cjs/package.json`;
          });
        },
      },
    ],
  });
};

const buildTypes = async dir => {
  console.log(chalk.blue("Building types..."));
  await $`tsc --emitDeclarationOnly --outDir ${dir} --moduleResolution bundler -m esnext`;
};

const main = async () => {
  return Promise.all([buildEsm(), buildCjs(), buildTypes("lib/types")]);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

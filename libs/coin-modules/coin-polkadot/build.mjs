#!/usr/bin/env zx
/* eslint-disable no-undef, no-console */
import "zx/globals";

import * as esbuild from "esbuild";

let config = {
  entryPoints: ["src/**/*"],
  minify: true,
  bundle: false,
  treeShaking: true,
  sourcemap: true,
  color: true,
  loader: {
    ".json": "copy",
    ".example": "copy",
    ".Dockerfile": "copy",
    ".yml": "copy",
  },
};

const buildEsm = async () => {
  console.log(chalk.blue("Building esm..."));
  await esbuild.build({
    ...config,
    outdir: "lib/esm",
    format: "esm",
    plugins: [
      {
        name: "copy-package-json",
        setup(build) {
          build.onEnd(() => {
            fs.copyFileSync("package.json", "lib/esm/package.json");
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
    plugins: [
      {
        name: "copy-package-json",
        setup(build) {
          build.onEnd(() => {
            fs.copyFileSync("package.json", "lib/cjs/package.json");
          });
        },
      },
    ],
  });
};

const buildTypes = async () => {
  console.log(chalk.blue("Building types..."));
  await $`tsc --emitDeclarationOnly --outDir lib/types --moduleResolution bundler -m esnext`;
};

const main = async () => {
  return Promise.all([buildEsm(), buildCjs(), buildTypes()]);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

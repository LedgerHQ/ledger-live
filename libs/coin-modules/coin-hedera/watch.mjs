#!/usr/bin/env zx
/* eslint-disable no-undef */
import "zx/globals";

import * as esbuild from "esbuild";

const { platform } = argv;

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

const getEsmContext = async () => {
  console.log(chalk.blue("Getting esm context..."));

  return esbuild.context({
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

const getCjsContext = async () => {
  console.log(chalk.blue("Getting cjs context..."));

  return esbuild.context({
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

const watchTypes = async () => {
  await $`tsc --watch --emitDeclarationOnly --outDir lib/types --moduleResolution bundler -m esnext`;
};

const watch = async () => {
  const esmContext = await getEsmContext();
  const cjsContext = await getCjsContext();

  if (platform === "esm") {
    console.log(chalk.blue("Watching esm..."));
    await Promise.all([esmContext.watch(), watchTypes()]);
  } else if (platform === "cjs") {
    console.log(chalk.blue("Watching cjs..."));
    await Promise.all([cjsContext.watch(), watchTypes()]);
  } else {
    console.log(chalk.blue("Watching all..."));
    await Promise.all([esmContext.watch(), cjsContext.watch(), watchTypes()]);
  }
};

watch().catch(error => {
  console.error(error);
  process.exitCode = error?.exitCode ?? 1;
});

const esbuild = require("esbuild");
const glob = require("tiny-glob");

const commonConfig = {
  sourcemap: true,
  logLevel: "error",
};

const commonjs = () =>
  glob("./**/*.ts").then((entryPoints) =>
    esbuild.build({
      ...commonConfig,
      entryPoints,
      outdir: "lib/cjs",
      format: "cjs",
    }),
  );

commonjs().catch((error) => {
  console.error(error);
  process.exit(1);
});

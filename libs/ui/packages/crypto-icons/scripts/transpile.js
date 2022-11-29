const esbuild = require("esbuild");
const glob = require("tiny-glob");

const commonConfig = {
  sourcemap: true,
  logLevel: "error",
};

const globEntryPoints = () =>
  Promise.all(
    ["src/react/**/*.ts", "src/react/**/*.tsx"].map((path) => glob(path)),
  ).then(([ts, tsx]) => [...ts, ...tsx]);

const commonjs = () =>
  globEntryPoints().then((entryPoints) =>
    esbuild.build({
      ...commonConfig,
      entryPoints,
      outdir: "react/cjs",
      format: "cjs",
    }),
  );

commonjs().catch((error) => {
  console.error(error);
  process.exit(1);
});

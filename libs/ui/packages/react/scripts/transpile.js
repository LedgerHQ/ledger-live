const esbuild = require("esbuild");
const glob = require("tiny-glob");

const globEntryPoints = () =>
  Promise.all([`src/**/*.ts`, `src/**/*.tsx`].map((path) => glob(path))).then(([ts, tsx]) => [
    ...ts,
    ...tsx,
  ]);

const commonConfig = {
  entryPoints: ["src/index.ts"],
  sourcemap: true,
};

const commonjs = () =>
  globEntryPoints().then((entryPoints) =>
    esbuild.build({
      ...commonConfig,
      entryPoints,
      outdir: "lib/cjs",
      format: "cjs",
      target: "node16",
    }),
  );

commonjs().catch((error) => {
  console.error(error);
  process.exit(1);
});

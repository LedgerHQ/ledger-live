const esbuild = require("esbuild");
const glob = require("tiny-glob");

const commonConfig = {
  sourcemap: true,
  logLevel: "error",
};

const globEntryPoints = folder =>
  Promise.all([`${folder}/**/*.ts`, `${folder}/**/*.tsx`].map(path => glob(path))).then(
    ([ts, tsx]) => [...ts, ...tsx],
  );

const buildForFolder = (folder, outputFolder) =>
  globEntryPoints(folder).then(entryPoints =>
    esbuild.build({
      ...commonConfig,
      entryPoints,
      outdir: `${outputFolder}/cjs`,
      format: "cjs",
    }),
  );

Promise.all([
  buildForFolder("src/react", "react"),
  buildForFolder("src/reactLegacy", "reactLegacy"),
]).catch(error => {
  console.error(error);
  process.exit(1);
});

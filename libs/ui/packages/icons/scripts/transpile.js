const path = require("path");
const { rspack } = require("@rspack/core");
const glob = require("tiny-glob");

const rootDir = path.resolve(__dirname, "..");

const globEntryPoints = folder =>
  Promise.all([`${folder}/**/*.ts`, `${folder}/**/*.tsx`].map(pattern => glob(pattern))).then(
    ([ts, tsx]) => [...ts, ...tsx],
  );

const createEntryMap = (entryPoints, baseDir) =>
  entryPoints.reduce((acc, entryPoint) => {
    const withoutExtension = entryPoint.replace(/\.[^.]+$/, "");
    const entryName = path
      .relative(baseDir, path.resolve(rootDir, withoutExtension))
      .split(path.sep)
      .join("/");
    acc[entryName] = path.resolve(rootDir, entryPoint);
    return acc;
  }, {});

const runRspack = (entryPoints, baseDir, outputFolder) =>
  new Promise((resolve, reject) => {
    const compiler = rspack({
      context: rootDir,
      mode: "production",
      target: "node16",
      entry: createEntryMap(entryPoints, baseDir),
      output: {
        path: path.resolve(rootDir, outputFolder, "cjs"),
        filename: "[name].js",
        library: {
          type: "commonjs2",
        },
        clean: false,
      },
      devtool: "source-map",
      resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
              },
            },
            type: "javascript/auto",
          },
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "ecmascript",
                  jsx: true,
                },
              },
            },
            type: "javascript/auto",
          },
        ],
      },
      optimization: {
        minimize: false,
        splitChunks: false,
        runtimeChunk: false,
      },
      stats: "errors-warnings",
    });

    compiler.run((error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      const info = stats?.toJson({ all: false, errors: true, warnings: true });
      if (stats?.hasErrors()) {
        reject(new Error(info?.errors?.[0]?.message || "Rspack build failed"));
        return;
      }

      compiler.close(closeError => {
        if (closeError) {
          reject(closeError);
        } else {
          resolve();
        }
      });
    });
  });

const buildForFolder = (folder, outputFolder) => {
  const baseDir = path.resolve(rootDir, folder);
  return globEntryPoints(folder).then(entryPoints => runRspack(entryPoints, baseDir, outputFolder));
};

Promise.all([
  buildForFolder("src/react", "react"),
  buildForFolder("src/reactLegacy", "reactLegacy"),
]).catch(error => {
  console.error(error);
  process.exit(1);
});

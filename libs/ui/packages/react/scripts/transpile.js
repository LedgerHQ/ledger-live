const path = require("path");
const { rspack } = require("@rspack/core");
const glob = require("tiny-glob");

const globEntryPoints = () =>
  Promise.all([`src/**/*.ts`, `src/**/*.tsx`].map(filePath => glob(filePath))).then(([ts, tsx]) => [
    ...ts,
    ...tsx,
  ]);

const commonConfig = {
  devtool: "source-map",
  mode: "production",
  target: "node",
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
              tsx: true,
            },
            target: "es2020",
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.woff2$/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name].woff2",
        },
      },
    ],
  },
  externals: [
    ({ request }, callback) => {
      if (!request) {
        callback();
        return;
      }

      if (request.startsWith(".") || path.isAbsolute(request)) {
        callback();
        return;
      }

      callback(null, `commonjs ${request}`);
    },
  ],
};

const toEntryMap = (files, baseDir) =>
  Object.fromEntries(
    files.map(file => {
      const entryName = path
        .relative(baseDir, file)
        .replace(path.extname(file), "")
        .split(path.sep)
        .join("/");
      return [entryName, path.resolve(file)];
    }),
  );

const runCompiler = config =>
  new Promise((resolve, reject) => {
    const compiler = rspack(config);
    compiler.run((error, stats) => {
      compiler.close(() => {});
      if (error) {
        reject(error);
        return;
      }
      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ colors: true, errors: true })));
        return;
      }
      resolve();
    });
  });

const commonjs = async () => {
  const entryPoints = await globEntryPoints();
  const entry = toEntryMap(entryPoints, "src");
  await runCompiler({
    ...commonConfig,
    entry,
    output: {
      path: path.resolve(process.cwd(), "lib/cjs"),
      filename: "[name].js",
      library: { type: "commonjs2" },
      clean: false,
    },
  });
};

commonjs().catch(error => {
  console.error(error);
  process.exit(1);
});

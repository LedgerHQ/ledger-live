const babelPlugins = require("./babel.plugins");
const semver = require("semver");
const electronVersion = require("./package.json").devDependencies.electron;

module.exports = api =>
  api.env("test")
    ? {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                electron: semver.major(semver.coerce(electronVersion)),
                node: "current",
              },
              modules: "commonjs",
            },
          ],
          "@babel/preset-react",
          "@babel/preset-flow",
          "@babel/preset-typescript",
        ],
        plugins: [
          ...babelPlugins,
          [
            "module-resolver",
            {
              alias: {
                "^~/(.+)": "./src/\\1",
              },
            },
          ],
        ],
      }
    : {};

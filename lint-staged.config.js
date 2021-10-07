const packages = ["react", "native"];

module.exports = packages.reduce(
  (config, package) => ({
    ...config,
    [`packages/${package}/**/*.ts?(x)`]: () => [
      `yarn --cwd packages/${package} lint:fix`,
      `yarn --cwd packages/${package} typecheck`,
    ],
  }),
  {}
);

const packages = ["react", "native"];

module.exports = packages.reduce(
  (config, package) => ({
    ...config,
    [`packages/${package}/**/*.ts?(x)`]: () => [
      `yarn --cwd packages/${package} lint`,
      `yarn --cwd packages/${package} typecheck`,
    ],
  }),
  {}
);

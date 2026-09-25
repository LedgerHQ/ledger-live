require("ts-node").register({
  skipProject: true,
  transpileOnly: true,
  compilerOptions: {
    esModuleInterop: true,
    experimentalDecorators: true,
    importHelpers: false,
    ignoreDeprecations: "6.0",
    module: "node16",
    moduleResolution: "node16",
    target: "es2022",
  },
});

module.exports = {
  esbuild: require("esbuild"),
  AliasPlugin: require("./plugins/alias"),
  CopyPlugin: require("./plugins/copy"),
  DotEnvPlugin: require("./plugins/dotenv"),
  JsonPlugin: require("./plugins/json"),
  NativeNodeModulesPlugin: require("./plugins/nativeNodeModules"),
  NodeExternalsPlugin: require("./plugins/nodeExternals"),
  StripFlowPlugin: require("./plugins/flow"),
  HtmlPlugin: require("@craftamap/esbuild-plugin-html").htmlPlugin,
  ImportGlobPlugin: require("esbuild-plugin-import-glob").default,
  ...require("./externals"),
};

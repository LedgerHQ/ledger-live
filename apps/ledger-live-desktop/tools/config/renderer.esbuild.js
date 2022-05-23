const path = require("path");
const {
  AliasPlugin,
  HtmlPlugin,
  DotEnvPlugin,
  electronRendererExternals,
  nodeExternals,
} = require("esbuild-utils");
const common = require("./common.esbuild");

module.exports = {
  ...common,
  entryPoints: ["src/renderer/index.js"],
  entryNames: "renderer.bundle",
  platform: "node",
  target: ["chrome91"],
  format: "iife",
  mainFields: ["browser", "module", "main"],
  external: [
    ...nodeExternals.filter(external => !external.startsWith("buffer")),
    ...electronRendererExternals,
  ],
  resolveExtensions: process.env.V3
    ? [".v3.tsx", ".v3.ts", ".v3.jsx", ".v3.js", ".tsx", ".ts", ".jsx", ".js", ".json"]
    : [".jsx", ".js", ".v3.tsx", ".v3.ts", ".v3.jsx", ".v3.js", ".tsx", ".ts", ".json"],
  plugins: [
    ...common.plugins,
    AliasPlugin({
      // Alias react to prevent esbuild trying to resolve them wrongly.
      react: [require.resolve("react"), path.dirname(require.resolve("react"))],
      // With the default import, styled-components assumes that the code is executed server-side.
      // It prevents the global styles from working.
      // See: https://github.com/styled-components/styled-components/issues/3714#issuecomment-1112672142
      "styled-components": [require.resolve("styled-components/dist/styled-components")],
    }),
    HtmlPlugin({
      files: [
        {
          entryPoints: ["src/renderer/index.js", "renderer.bundle.css"],
          htmlTemplate: "src/renderer/index.html",
          filename: "index.html",
          title: "Ledger Live",
        },
      ],
    }),
    DotEnvPlugin(
      process.env.TESTING
        ? ".env.testing"
        : process.env.STAGING
        ? ".env.staging"
        : process.env.NODE_ENV === "production"
        ? ".env.production"
        : ".env",
    ),
    // {
    //   name: "Side Effects",
    //   setup(build) {
    //     build.onResolve({ filter: /\.woff2$/ }, async args => {
    //       if (args.importer.endsWith("libs/ui/packages/react/lib/assets/fonts.js")) {
    //         console.log(args.path);
    //         return {
    //           sideEffects: true,
    //         };
    //       }
    //     });
    //   },
    // },
  ],
};

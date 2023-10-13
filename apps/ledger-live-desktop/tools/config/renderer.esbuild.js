const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const {
  AliasPlugin,
  HtmlPlugin,
  DotEnvPlugin,
  electronRendererExternals,
  nodeExternals,
} = require("esbuild-utils");
const { DOTENV_FILE } = require("../utils");
const common = require("./common.esbuild");

const ensureDirectoryExistence = filePath => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

module.exports = {
  ...common,
  entryPoints: ["src/renderer/index.ts"],
  entryNames: "renderer.bundle",
  jsx: "automatic",
  platform: "browser",
  target: ["chrome114"],
  format: "iife",
  mainFields: ["browser", "module", "main"],
  assetNames: "assets/[name]-[hash]",
  external: [...nodeExternals, ...electronRendererExternals],
  resolveExtensions: process.env.V3
    ? [".v3.tsx", ".v3.ts", ".tsx", ".ts", ".js", ".jsx", ".json"]
    : [".tsx", ".ts", ".v3.tsx", ".v3.ts", ".js", ".jsx", ".json"],
  plugins: [
    ...common.plugins,
    AliasPlugin({
      // Alias react to prevent esbuild trying to resolve them wrongly.
      react: [require.resolve("react"), path.dirname(require.resolve("react"))],
      // With the default import, styled-components assumes that the code is executed server-side.
      // It prevents the global styles from working.
      // See: https://github.com/styled-components/styled-components/issues/3714#issuecomment-1112672142
      "styled-components": [require.resolve("styled-components/dist/styled-components")],
      "buffer/": "buffer",
    }),
    HtmlPlugin({
      files: [
        {
          entryPoints: ["src/renderer/index.ts", "renderer.bundle.css"],
          htmlTemplate: "src/renderer/index.html",
          filename: "index.html",
          title: "Ledger Live",
        },
      ],
    }),
    DotEnvPlugin(DOTENV_FILE),
    {
      name: "assets-plugin",
      setup(build) {
        build.onResolve({ filter: /\.(json)$/ }, args => {
          if (args.resolveDir.includes("ledger-live-desktop/src")) {
            const sourcePath = path.resolve(args.resolveDir, args.path);
            const fileContent = fs.readFileSync(sourcePath);

            const hash = crypto.createHash("sha1").update(fileContent).digest("hex");

            const fileName = `${hash}-${path.basename(args.path)}`;
            const targetPath = path.resolve(".webpack/assets", fileName);

            ensureDirectoryExistence(targetPath);
            fs.copyFileSync(sourcePath, targetPath);

            return {
              path: targetPath,
              external: true,
            };
          }

          return undefined;
        });
      },
    },
  ],
};

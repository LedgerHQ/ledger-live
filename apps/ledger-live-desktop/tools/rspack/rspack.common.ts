import path from "path";
import fs from "fs";
import type { RspackOptions } from "@rspack/core";

export const rootFolder = path.resolve(__dirname, "..", "..");
export const srcFolder = path.resolve(rootFolder, "src");
export const outputFolder = path.resolve(rootFolder, ".webpack");

/**
 * @sentry/utils@6.19.7 (pulled transitively by @ledgerhq/device-transport-kit-web-hid)
 * imports the `Severity` enum from @sentry/types, which only exists in v6. pnpm nests
 * @sentry/types@6.19.7 next to it, but Rspack v2's resolver picks the hoisted v8
 * (type-only) build, breaking with "module has no exports". Force the bare specifier to
 * v6's CJS build (no `exports` field, and CJS dynamic interop avoids the strict-ESM
 * check). Runtime-safe for v8 consumers since @sentry/types carries no runtime API there.
 */
function resolveSentryTypesV6Alias(): Record<string, string> {
  const pnpmDir = path.resolve(rootFolder, "..", "..", "node_modules", ".pnpm");
  const semver = (d: string) =>
    d.slice("@sentry+types@".length).split("_")[0].split(".").map(Number);
  const matches = fs.existsSync(pnpmDir)
    ? fs
        .readdirSync(pnpmDir)
        .filter(d => d.startsWith("@sentry+types@6."))
        .sort((a, b) => {
          const va = semver(a);
          const vb = semver(b);
          for (let i = 0; i < Math.max(va.length, vb.length); i++) {
            const diff = (vb[i] ?? 0) - (va[i] ?? 0);
            if (diff !== 0) return diff;
          }
          return 0;
        })
    : [];
  if (matches.length === 0) {
    throw new Error(
      "rspack.common: expected @sentry/types@6.x in node_modules/.pnpm for the v6 alias " +
        "(see comment above). If @sentry/utils@6 was dropped from the tree, remove " +
        "resolveSentryTypesV6Alias; otherwise the renderer build fails with a cryptic " +
        '"module has no exports" error.',
    );
  }
  return {
    "@sentry/types$": path.join(pnpmDir, matches[0], "node_modules/@sentry/types/dist/index.js"),
  };
}

/**
 * Common rspack configuration shared across all build targets
 */
export const commonConfig: RspackOptions = {
  context: rootFolder,
  output: {
    path: outputFolder,
    clean: false, // We handle cleaning manually
  },
  resolve: {
    // Platform-specific file resolution:
    // .web.tsx/.web.ts are resolved first for desktop platform
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".jsx", ".js", ".json", ".lottie"],
    alias: {
      "~": srcFolder,
      ...resolveSentryTypesV6Alias(),
    },
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
            transform: {
              react: {
                runtime: "automatic",
              },
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
            transform: {
              react: {
                runtime: "automatic",
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[hash][ext]",
        },
      },
      {
        test: /\.(webm|mp4)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[hash][ext]",
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[hash][ext]",
        },
      },
      {
        test: /\.lottie$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[hash][ext]",
        },
      },
    ],
  },
  stats: {
    colors: true,
  },
};

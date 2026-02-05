import path from "path";
import fs from "fs";
import type { RspackOptions } from "@rspack/core";

export const rootFolder = path.resolve(__dirname, "..", "..");
export const srcFolder = path.resolve(rootFolder, "src");
export const outputFolder = path.resolve(rootFolder, ".webpack");
export const featuresFolder = path.resolve(rootFolder, "..", "..", "features");

/**
 * Build dynamic aliases for all features in the features folder.
 * Maps @features/<name> to features/<name>/src for each feature.
 */
function buildFeaturesAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};

  if (!fs.existsSync(featuresFolder)) {
    return aliases;
  }

  const entries = fs.readdirSync(featuresFolder, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const featureSrcPath = path.join(featuresFolder, entry.name, "src");
      if (fs.existsSync(featureSrcPath)) {
        aliases[`@features/${entry.name}`] = featureSrcPath;
      }
    }
  }

  return aliases;
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
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "~": srcFolder,
      // @features/* aliases are dynamically generated for each feature
      ...buildFeaturesAliases(),
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
    ],
  },
  stats: {
    colors: true,
  },
};

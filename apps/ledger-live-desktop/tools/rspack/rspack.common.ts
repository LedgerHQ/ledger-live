import path from "path";
import type { RspackOptions } from "@rspack/core";

export const rootFolder = path.resolve(__dirname, "..", "..");
export const srcFolder = path.resolve(rootFolder, "src");
export const outputFolder = path.resolve(rootFolder, ".webpack");

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

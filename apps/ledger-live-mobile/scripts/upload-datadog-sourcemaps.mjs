#!/usr/bin/env zx
/**
 * Upload JavaScript source maps to Datadog for RUM error symbolication.
 *
 * Prerequisites:
 * - DATADOG_API_KEY (required): Datadog API key (not the RUM client token).
 *   Create in Datadog: Organization Settings → API Keys.
 * - DATADOG_SITE (optional): e.g. datadoghq.eu if not US1.
 * - RELEASE_VERSION (optional): Version to tag the source map with; must match
 *   the version sent by the RUM SDK (VersionNumber.appVersion). Defaults to package.json version.
 * - DATADOG_SERVICE (optional): Service name; must match RUM serviceName (Config.APP_NAME).
 *   Defaults to "live-mobile".
 *
 * Usage:
 *   pnpm datadog:sourcemaps:upload [--platform android|ios] [--path <dir>]
 *
 * For Android, --path defaults to android/app/build (recursive search finds .js and .js.map).
 * For iOS, pass --path to the directory containing the bundle and source map (e.g. after Xcode build).
 */
/* eslint no-console: 0 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const pkg = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf-8"));

const apiKey = process.env.DATADOG_API_KEY;
if (!apiKey) {
  console.log(
    "DATADOG_API_KEY not set; skipping source map upload. Set it in CI secrets to upload.",
  );
  process.exit(0);
}

const args = process.argv.slice(2);
const platformIdx = args.indexOf("--platform");
const pathIdx = args.indexOf("--path");
const platform =
  platformIdx !== -1 && args[platformIdx + 1]
    ? args[platformIdx + 1]
    : process.env.DATADOG_SOURCEMAPS_PLATFORM || "android";
const customPath = pathIdx !== -1 && args[pathIdx + 1] ? args[pathIdx + 1] : null;
const releaseVersion = process.env.RELEASE_VERSION || pkg.version || "0.0.0";
const service = process.env.DATADOG_SERVICE || process.env.APP_NAME || "live-mobile";

const defaultPaths = {
  android: path.join(rootDir, "android", "app", "build"),
  ios: path.join(rootDir, "ios", "build"),
};

const uploadDir = customPath ? path.resolve(rootDir, customPath) : defaultPaths[platform];

try {
  await fs.access(uploadDir);
} catch {
  console.error(
    `Upload directory does not exist or is not readable: ${uploadDir}. Run a release build first, or pass --path <dir>.`,
  );
  process.exit(1);
}

console.log(
  `Uploading source maps to Datadog: service=${service}, version=${releaseVersion}, path=${uploadDir}`,
);

const prevEnv = { ...process.env };
process.env.DATADOG_API_KEY = apiKey;
if (process.env.DATADOG_SITE) {
  process.env.DATADOG_SITE = process.env.DATADOG_SITE;
}

// datadog-ci expects --minified-path-prefix to be a URL or absolute path; use app://localhost/ for React Native
await $`pnpm exec datadog-ci sourcemaps upload ${uploadDir} --service ${service} --release-version ${releaseVersion} --minified-path-prefix "app://localhost/"`;

Object.assign(process.env, prevEnv);

console.log("Source maps uploaded successfully.");

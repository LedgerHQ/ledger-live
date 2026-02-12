import childProcess from "child_process";
import type { Plugins } from "@rspack/core";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { prerelease } from "semver";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require("../../package.json");

export const lldRoot = path.resolve(__dirname, "..", "..");

let GIT_REVISION = process.env.GIT_REVISION;

if (!GIT_REVISION) {
  try {
    GIT_REVISION = childProcess.execSync("git rev-parse --short HEAD").toString("utf8").trim();
  } catch {
    GIT_REVISION = "unknown";
  }
}

const parsed = prerelease(pkg.version);
let PRERELEASE = false;
let CHANNEL: string | null = null;
if (parsed) {
  PRERELEASE = !!(parsed && parsed.length);
  CHANNEL = String(parsed[0]);
}

const SENTRY_URL = process.env.SENTRY_URL;

/**
 * Determines which .env file to use based on environment
 */
export const DOTENV_FILE = process.env.TESTING
  ? ".env.testing"
  : process.env.STAGING
    ? ".env.staging"
    : process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env";

/**
 * Reads and parses a dotenv file, returning define entries
 */
export function buildDotEnvDefine(envPath: string): Record<string, string> {
  const define: Record<string, string> = {};
  try {
    const envFile = path.resolve(lldRoot, envPath);
    if (fs.existsSync(envFile)) {
      const buf = fs.readFileSync(envFile);
      const config = dotenv.parse(buf);
      Object.entries(config).forEach(([key, value]) => {
        define[`process.env.${key}`] = JSON.stringify(value);
      });
    }
  } catch {
    // Ignore errors
  }
  return define;
}

/**
 * Build environment defines for main process
 */
export function buildMainEnv(
  mode: "development" | "production",
  argv?: { port?: number },
): Record<string, string> {
  const env: Record<string, string> = {
    __DEV__: JSON.stringify(mode === "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_REVISION__: JSON.stringify(GIT_REVISION),
    __SENTRY_URL__: JSON.stringify(SENTRY_URL || null),
    // See: https://github.com/node-formidable/formidable/issues/337
    "global.GENTLY": JSON.stringify(false),
    __PRERELEASE__: JSON.stringify(PRERELEASE),
    __CHANNEL__: JSON.stringify(CHANNEL),
  };

  if (mode === "development" && argv?.port) {
    env.INDEX_URL = JSON.stringify(`http://localhost:${argv.port}/index.html`);
  }

  return env;
}

/**
 * Build environment defines for renderer process
 */
export function buildRendererEnv(mode: "development" | "production"): Record<string, string> {
  return {
    __DEV__: JSON.stringify(mode === "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_REVISION__: JSON.stringify(GIT_REVISION),
    __SENTRY_URL__: JSON.stringify(SENTRY_URL || null),
    __PRERELEASE__: JSON.stringify(PRERELEASE),
    __CHANNEL__: JSON.stringify(CHANNEL),
    "process.env.NODE_ENV": JSON.stringify(mode),
  };
}

export { pkg, GIT_REVISION, PRERELEASE, CHANNEL, SENTRY_URL };

/**
 * When RSDOCTOR env is set (and not "0"), returns the RsdoctorRspackPlugin instance
 * so build analysis runs for all bundles. By default rsdoctor is off.
 * In CI, uses brief mode + JSON output for web-infra-dev/rsdoctor-action.
 * reportDir is set so the action gets a known path (per rsdoctor.dev/config/options/output).
 */
export function getRsdoctorPlugin(): Plugins {
  if (process.env.RSDOCTOR && process.env.RSDOCTOR !== "0") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin");
    const isCI = process.env.CI === "true" || process.env.CI === "1";
    const repoRoot = path.resolve(lldRoot, "..", "..");
    const options = isCI
      ? {
          disableClientServer: true,
          output: {
            mode: "brief" as const,
            options: { type: ["json" as const] },
            reportDir: path.join(repoRoot, "_rsdoctor-desktop"),
          },
        }
      : undefined;
    return [new RsdoctorRspackPlugin(options)] as Plugins;
  }
  return [];
}

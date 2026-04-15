#!/usr/bin/env node
/**
 * Merges nx.workspace.json + nx.s3.defaults.json + cacheKeyPrefix into gitignored nx.cache-config.json.
 * CI sets NX_CACHE_KEY_PREFIX (develop | branch); local default is "local".
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseCacheKeyPrefix(argv, env) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--cache-key-prefix" && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  const fromEnv = (env.NX_CACHE_KEY_PREFIX || "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  return "local";
}

const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
const cacheKeyPrefix = parseCacheKeyPrefix(process.argv.slice(2), process.env);

const workspacePath = path.join(workspaceRoot, "nx.workspace.json");
const s3DefaultsPath = path.join(workspaceRoot, "nx.s3.defaults.json");
const outPath = path.join(workspaceRoot, "nx.cache-config.json");

const workspace = JSON.parse(fs.readFileSync(workspacePath, "utf8"));
const s3Defaults = JSON.parse(fs.readFileSync(s3DefaultsPath, "utf8"));

const output = {
  ...workspace,
  s3: {
    ...s3Defaults,
    cacheKeyPrefix,
  },
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

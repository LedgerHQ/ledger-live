#!/usr/bin/env node
/**
 * Build wallet-cli-${channel}.json for CDN: version, channel, baseUrl, per-artifact filename, url, sha256.
 * Reads local build artifacts and hashes the exact bytes that will be uploaded.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    version: { type: "string" },
    channel: { type: "string" },
    "base-url": { type: "string" },
    output: { type: "string" },
    "linux-x64": { type: "string" },
    "linux-arm64": { type: "string" },
    "windows-x64": { type: "string" },
    "darwin-arm64": { type: "string" },
  },
  allowPositionals: false,
});

const required = ["version", "channel", "base-url", "output", "linux-x64", "linux-arm64", "windows-x64", "darwin-arm64"];
for (const k of required) {
  if (values[k] === undefined || values[k] === "") {
    console.error(`Missing required option: --${k}`);
    process.exit(1);
  }
}

function sha256File(path) {
  const h = createHash("sha256");
  h.update(readFileSync(path));
  return h.digest("hex");
}

const version = values.version;
const channel = values.channel;
const baseUrl = values["base-url"].replace(/\/$/, "");
const base = `ledger-wallet-cli-${version}`;

const paths = {
  "linux-x64": values["linux-x64"],
  "linux-arm64": values["linux-arm64"],
  "windows-x64": values["windows-x64"],
  "darwin-arm64": values["darwin-arm64"],
};

const filenames = {
  "linux-x64": `${base}-linux-x64`,
  "linux-arm64": `${base}-linux-arm64`,
  "windows-x64": `${base}-windows-x64.exe`,
  "darwin-arm64": `${base}-darwin-arm64`,
};

/** @type {Record<string, { filename: string; url: string; sha256: string }>} */
const artifacts = {};
for (const key of Object.keys(paths)) {
  const filename = filenames[key];
  artifacts[key] = {
    filename,
    url: `${baseUrl}/${filename}`,
    sha256: sha256File(paths[key]),
  };
}

const doc = {
  version,
  channel,
  baseUrl,
  artifacts,
};

writeFileSync(values.output, `${JSON.stringify(doc, null, 2)}\n`, "utf8");

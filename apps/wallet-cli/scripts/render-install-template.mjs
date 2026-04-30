#!/usr/bin/env node
/**
 * Embed --version into install-wallet-cli.sh.template for CDN upload.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    version: { type: "string" },
    template: { type: "string" },
    output: { type: "string" },
  },
  required: ["version", "template", "output"],
});

if (values.version.includes("'")) {
  console.error("VERSION must not contain single quotes");
  process.exit(1);
}

let text = readFileSync(values.template, "utf8");
text = text.replaceAll("__WALLET_CLI_VERSION__", values.version);
writeFileSync(values.output, text, "utf8");

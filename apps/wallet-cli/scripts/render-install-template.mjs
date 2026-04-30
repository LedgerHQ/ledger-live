#!/usr/bin/env node
/**
 * Embed channel into install-wallet-cli.sh.template for CDN upload.
 * The rendered script resolves version and binary URL from wallet-cli-${channel}.json.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    channel: { type: "string" },
    template: { type: "string" },
    output: { type: "string" },
  },
  required: ["channel", "template", "output"],
});

const channel = values.channel;
if (!/^[a-zA-Z0-9._-]+$/.test(channel)) {
  console.error("CHANNEL must be alphanumeric plus . _ - only");
  process.exit(1);
}
if (channel.includes("'")) {
  console.error("CHANNEL must not contain single quotes");
  process.exit(1);
}

let text = readFileSync(values.template, "utf8");
text = text.replaceAll("__WALLET_CLI_CHANNEL__", channel);
writeFileSync(values.output, text, "utf8");

#!/usr/bin/env zx
import { basename } from "path";
import stylish from "../../../node_modules/eslint/lib/cli-engine/formatters/stylish.js";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

const usage = () => {
  console.log(`Usage: ${basename(__filename)} [-h] [-p <port>] [-t <server-token>]`);
  process.exit(1);
};

let port, token, external;

for (const arg in argv) {
  switch (arg) {
    case "h":
      usage();
      break;
    case "p":
      port = argv[arg];
      break;
    case "t":
      token = argv[arg];
      break;
    case "external":
      external = true;
      break;
    case "_":
      break;
    default:
      usage();
      break;
  }
}

const output = external ? "lint-desktop-external.json" : "lint-desktop.json";
const lint = async () => {
  cd("../../");
  if (port && token) {
    await $`pnpm lint \\
      --filter="ledger-live-desktop" \\
      --api="http://127.0.0.1:${port}" \\
      --token=${token} \\
      --team="foo" \\
      -- --format="json" \\
      -o="${output}"`;
  } else {
    await $`pnpm lint \\
      --filter="ledger-live-desktop" \\
      -- --format="json" \\
      -o="${output}"`;
  }

  const lintJson = require(`../${output}`);
  stylish(lintJson);
};

await lint();

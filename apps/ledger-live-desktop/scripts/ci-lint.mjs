#!/usr/bin/env zx
import { basename } from 'path'
import stylish from "../../../node_modules/eslint/lib/cli-engine/formatters/stylish.js"

const usage = () => {
  console.log(`Usage: ${basename(__filename)} [-h] [-p <port>] [-t <server-token>]`);
  process.exit(1)
}

let port, token;

for (const arg in argv) {
  switch (arg) {
    case 'h':
      usage();
      break;
    case 'p':
      port = argv[arg];
      break
    case 't':
      token = argv[arg];
      break;
    case '_':
      break;
    default:
      usage();
      break;
  }
}

if (typeof token !== "string") {
  usage();
}

const lint = async () => {
  cd('../../')

  if (typeof port === 'string') {
    await $`pnpm lint \\
      --filter="ledger-live-desktop" \\
      --api="http://127.0.0.1:${port}" \\
      --token=${token} \\
      --team="foo" \\
      -- --format="json" \\
      -o="lint.json"`;
  } else {
    await $`pnpm lint \\
      --filter="ledger-live-desktop" \\
      --token=${token} \\
      --team="foo" \\
      -- --format="json" \\
      -o="lint.json"`;
  }

  const lintJson = require('../lint.json')
  stylish(lintJson);
}

await lint()

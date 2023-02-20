#!/usr/bin/env zx

const p = await $`./bin/index.js version`;

const acceptedWarnings = [
  "bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)", // https://ledgerhq.atlassian.net/browse/LIVE-5477
  "Patching Protobuf Long.js instance...", // https://ledgerhq.atlassian.net/browse/LIVE-5478
];

const errors = p.stderr
  .split("\n")
  .filter((l) => l && !acceptedWarnings.includes(l));

if (errors.length > 0) {
  console.error(
    "/!\\ NOGO. Some warnings are logged by the CLI. Please fix them, this is a blocker to not ship more warnings than we already have. It costs time for all devs when we do.",
    errors
  );
  process.exit(1);
}

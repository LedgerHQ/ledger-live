#!/usr/bin/env zx
import { basename } from "path";
import fs from "fs";

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
const outputPath = `apps/ledger-live-desktop/${output}`;

const lint = async () => {
  cd("../../");
  const lintArgs = ["--filter=ledger-live-desktop", "--", "--format=json"];
  if (port && token) {
    lintArgs.splice(1, 0, `--api=http://127.0.0.1:${port}`, `--token=${token}`, "--team=foo");
  }
  const writable = fs.createWriteStream(outputPath);
  await $`pnpm lint ${lintArgs}`.nothrow().pipe(writable);
  writable.end();
  await new Promise(resolve => writable.on("finish", resolve));

  const raw = fs.readFileSync(outputPath, "utf8");
  let hasErrors = false;
  try {
    const lintJson = JSON.parse(raw);
    const diagnostics = lintJson.diagnostics ?? [];
    hasErrors = diagnostics.some(d => d.severity === "error");
    if (diagnostics.length > 0) {
      for (const d of diagnostics.slice(0, 20)) {
        const loc = d.labels?.[0]?.span;
        const line = loc ? `${d.filename}:${loc.line}` : d.filename;
        console.log(`${line} ${d.severity}: ${d.message}`);
      }
      if (diagnostics.length > 20) {
        console.log(`... and ${diagnostics.length - 20} more`);
      }
    }
  } catch (e) {
    console.error("Failed to parse lint output", e);
    hasErrors = true;
  }
  if (hasErrors) {
    process.exit(1);
  }
};

await lint();

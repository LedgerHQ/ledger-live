#!/usr/bin/env zx
import "zx/globals";
import fs from "fs";
import path from "path";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

const rootPath = path.join(__dirname, "..", "..", "..");
const basePath = path.join(__dirname, "..");
const replaceAssetsPath = path.join(
  rootPath,
  "ledger-live-internal-assets",
  "apps",
  "ledger-live-mobile",
);

async function replaceAssets() {
  await fs.promises.cp(replaceAssetsPath, basePath, { recursive: true, force: true });
}

await replaceAssets();

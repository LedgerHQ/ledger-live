#!/usr/bin/env zx
import "zx/globals";
import fs from "fs";
import path from "path";

const basePath = path.join(__dirname, "..", "..", "..");
const srcPath = path.join(__dirname, "..", "src");
const replaceAssetsPath = path.join(basePath, "ledger-live-internal-assets", "apps", "ledger-live-desktop", "src");

async function replaceAssets(){
  await fs.promises.cp(replaceAssetsPath, srcPath, { recursive: true, force: true});
}

await replaceAssets();

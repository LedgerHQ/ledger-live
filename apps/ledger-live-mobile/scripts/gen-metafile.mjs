#!/usr/bin/env zx
/* eslint no-console: 0 */

import * as fs from "fs/promises";
import * as path from "path";

const metakeys = {
  ios: "main.ios.jsbundle",
  android: "main.android.jsbundle",
};

async function genMetaFiles() {
  const basePath = path.join(__dirname, "..");
  const [ios, android] = await Promise.all([
    fs.lstat(path.join(basePath, metakeys.ios)),
    fs.lstat(path.join(basePath, metakeys.android)),
  ]);

  const meta = {
    [metakeys.ios]: {
      size: ios.size,
    },
    [metakeys.android]: {
      size: android.size,
    },
  };

  console.log(`Generating metafile ${JSON.stringify(meta, null, 2)}`);
  await fs.writeFile(path.join(basePath, "mobile.metafile.json"), JSON.stringify(meta), "utf-8");
}

await genMetaFiles();

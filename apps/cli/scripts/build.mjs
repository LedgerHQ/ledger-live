#!/usr/bin/env zx
import { $ } from "zx";
import fs from "node:fs";
import { createExportableManifest } from "@pnpm/exportable-manifest";
import { readProjectManifestOnly } from "@pnpm/read-project-manifest";
import yaml from "yaml";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

echo(chalk.green("Building bundled javascript"));

await $`rslib build`;

// Fix: Replace raw import.meta references that weren't shimmed (from @polkadot/api)
// This prevents Node.js v24+ from auto-detecting files as ESM when import.meta appears
// at the top level of a concatenated module in a CJS chunk.
// Apply to cli.js and all chunk files in lib/.
const libDir = "lib";
for (const file of fs.readdirSync(libDir)) {
  if (!file.endsWith(".js")) continue;
  const filePath = `${libDir}/${file}`;
  const original = fs.readFileSync(filePath, "utf8");
  // Replace import.meta (but not import.meta.url which is already shimmed by rslib)
  let content = original.replace(/\bimport\.meta\b(?!\.url)/g, "__rslib_import_meta_url__");

  if (file === "cli.js") {
    // Add window polyfill for browser-specific code from @dfinity packages
    if (content.includes("window") && !content.includes("globalThis.window")) {
      const windowPolyfill = `(function() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
})();
`;
      content = windowPolyfill + content;
    }
  }

  if (content !== original) fs.writeFileSync(filePath, content, "utf8");
}

echo(chalk.green("Copy the built folder to the publication folder"));
fs.cpSync("lib", "dist/lib", {
  force: true,
  recursive: true,
});

echo(chalk.green("Creating package.json with ledger dependencies removed"));

// Read the workspace configuration to get catalog entries
const workspaceConfig = yaml.parse(fs.readFileSync("../../pnpm-workspace.yaml", "utf8"));
const catalogs = workspaceConfig.catalog || {};

const manifest = await readProjectManifestOnly("./");
Object.entries(manifest.dependencies).forEach(([packageName]) => {
  if (packageName.startsWith("@ledgerhq")) {
    delete manifest.dependencies[packageName];
  }
});

const exportable = await createExportableManifest("./", manifest, {
  catalogs: { default: catalogs },
});
fs.writeFileSync("dist/package.json", JSON.stringify(exportable));

echo(chalk.green("Copy the .md's to the publication folder"));
fs.copyFileSync("README.md", "dist/README.md");
fs.copyFileSync("CHANGELOG.md", "dist/CHANGELOG.md");

echo(chalk.green("Copy the bin folder to finish the publication folder"));
fs.cpSync("bin", "dist/bin", {
  force: true,
  recursive: true,
});

echo(chalk.green("Bundling complete"));

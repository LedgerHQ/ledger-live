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

await $`tsup src/cli.ts`;

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

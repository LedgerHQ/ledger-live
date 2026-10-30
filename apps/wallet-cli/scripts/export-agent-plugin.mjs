// Export the agent plugin in its installable form: the files in agent-plugin/, the
// wallet-cli version stamped into every manifest that has one, and the skill under
// skills/ as export-standalone-skill.mjs writes it, so the plugin and the copy
// published to LedgerHQ/agent-skills go through the same transform.
//
// The sync-wallet-cli-skill workflow runs it against the root of a LedgerHQ/agent-skills
// checkout. That repository owns its README.md, so the export leaves out
// agent-plugin/README.md, along with the internal tests/ (see NOT_EXPORTED). It lists
// what it wrote in .ledger-plugin-files and deletes what the previous export listed but
// this one no longer writes, so a file removed from agent-plugin/ leaves agent-skills too.
//
// Usage:
//   node ./scripts/export-agent-plugin.mjs <target-dir>

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSkillFiles } from "./collect-skill-files.mjs";
import { STANDALONE_SKILL_NAME } from "./standalone-skill-transform.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "..");
const pluginDir = path.join(root, "agent-plugin");
const skillDir = path.resolve(root, "../../.agents/skills/ledger-wallet-cli");

// Manifests whose own version is the plugin version. The Claude Code marketplace
// versions each plugin entry instead, and the Codex marketplace has no version.
const TOP_LEVEL_VERSIONED = new Set([
  "package.json",
  "plugin.json",
  "openclaw.plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
]);
const PER_PLUGIN_VERSIONED = new Set([".claude-plugin/marketplace.json"]);
// Top-level entries that stay in the monorepo: the install guide, mirrored by hand into
// agent-skills' README, and the manual smoke checklist, which is internal.
const NOT_EXPORTED = new Set(["README.md", "tests"]);
const EXPORTED_LIST = ".ledger-plugin-files";

// The sources carry no version, so a release can never leave a stale one behind.
function withVersion(manifest, version, rel) {
  if ("version" in manifest) {
    throw new Error(`agent-plugin/${rel} sets "version"; the export takes it from package.json.`);
  }
  if (!("description" in manifest)) {
    throw new Error(`agent-plugin/${rel} has no "description" to place "version" after.`);
  }
  return Object.fromEntries(
    Object.entries(manifest).flatMap(entry =>
      entry[0] === "description" ? [entry, ["version", version]] : [entry],
    ),
  );
}

function stamp(rel, content, version) {
  if (TOP_LEVEL_VERSIONED.has(rel)) {
    return JSON.stringify(withVersion(JSON.parse(content), version, rel), null, 2) + "\n";
  }
  if (PER_PLUGIN_VERSIONED.has(rel)) {
    const manifest = JSON.parse(content);
    manifest.plugins = manifest.plugins.map(plugin => withVersion(plugin, version, rel));
    return JSON.stringify(manifest, null, 2) + "\n";
  }
  return content;
}

// The list is read from the target repository, so an entry must stay inside it.
async function previousExport(targetDir) {
  let list;
  try {
    list = await readFile(path.join(targetDir, EXPORTED_LIST), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const entries = list.split("\n").filter(Boolean);
  for (const rel of entries) {
    if (path.isAbsolute(rel) || path.normalize(rel).split(path.sep).includes("..")) {
      throw new Error(`${EXPORTED_LIST} lists "${rel}", which is outside the target.`);
    }
  }
  return entries;
}

async function main() {
  const [targetDir] = process.argv.slice(2);
  if (!targetDir) {
    throw new Error("Usage: node ./scripts/export-agent-plugin.mjs <target-dir>");
  }

  const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const files = (
    await collectSkillFiles(pluginDir, { boundary: pluginDir, label: "agent-plugin" })
  ).filter(rel => !NOT_EXPORTED.has(rel.split("/")[0]));

  const exported = new Set(files);
  for (const rel of await previousExport(targetDir)) {
    if (!exported.has(rel)) await rm(path.join(targetDir, rel), { force: true });
  }
  for (const rel of files) {
    const content = await readFile(path.join(pluginDir, rel), "utf8");
    const target = path.join(targetDir, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, stamp(rel, content, version), "utf8");
  }
  await writeFile(path.join(targetDir, EXPORTED_LIST), [...files].sort().join("\n") + "\n", "utf8");

  execFileSync(
    process.execPath,
    [
      path.join(scriptsDir, "export-standalone-skill.mjs"),
      skillDir,
      path.join(targetDir, "skills", STANDALONE_SKILL_NAME),
    ],
    { stdio: "inherit" },
  );

  console.log(
    `Exported the agent plugin ${version} (${files.length} file(s) and the skill) to ${targetDir}.`,
  );
}

await main();

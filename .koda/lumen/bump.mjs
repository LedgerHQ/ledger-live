/**
 * Moves every Lumen dependency and pnpm catalog entry to npm `latest`, keeping `^`/`~` and the
 * file formatting. Skips peerDependencies, never downgrades, never targets a prerelease.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VERSION = /^([\^~]?)(\d+)\.(\d+)\.(\d+)(\S*)$/;
const LUMEN_DEPENDENCY = /("(@ledgerhq\/lumen-[a-z-]+)"\s*:\s*")([^"]+)"/g;
const LUMEN_CATALOG_ENTRY =
  /^(\s+["']?(@ledgerhq\/lumen-[a-z-]+)["']?\s*:\s*["']?)([^"'\s#]+)(.*)$/;
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];
const latestVersions = new Map();
const changes = [];

/** Whether stable `next` is newer than `current`; a prerelease loses to its own stable release. */
const isNewer = (next, current) => {
  const a = next.match(VERSION);
  const b = current.match(VERSION);
  if (!a || !b || a[5]) return false;
  for (let i = 2; i <= 4; i++)
    if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  return b[5].startsWith("-");
};

/** The npm `latest` version of a package, fetched once. */
const latestOf = name => {
  if (!latestVersions.has(name)) {
    latestVersions.set(name, execSync(`npm view ${name} version`).toString().trim());
  }
  return latestVersions.get(name);
};

/** The spec moved to `latest` when that is newer, logged; the spec unchanged otherwise. */
const bump = (file, name, spec) => {
  const match = spec.match(VERSION);
  if (!match || !isNewer(latestOf(name), spec.slice(match[1].length))) return spec;
  const next = match[1] + latestOf(name);
  changes.push(`${file} ${name} ${spec} -> ${next}`);
  return next;
};

/** Every package.json under `dir`, outside node_modules and .git. */
const manifestsIn = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "node_modules" || entry.name === ".git") return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return manifestsIn(path);
    return entry.name === "package.json" ? [path] : [];
  });

/** Bumps the Lumen entries of each dependency field, editing only inside its braces. */
const bumpManifest = file => {
  let text = readFileSync(file, "utf8");
  for (const field of DEPENDENCY_FIELDS) {
    const open = text.match(new RegExp(`"${field}"\\s*:\\s*\\{`));
    if (!open) continue;
    const from = open.index + open[0].length;
    const to = text.indexOf("}", from);
    const block = text
      .slice(from, to)
      .replace(LUMEN_DEPENDENCY, (_, head, name, spec) => `${head}${bump(file, name, spec)}"`);
    text = text.slice(0, from) + block + text.slice(to);
  }
  writeFileSync(file, text);
};

/** Bumps the Lumen entries of a pnpm catalog, keeping quotes and trailing comments. */
const bumpCatalog = file => {
  const lines = readFileSync(file, "utf8")
    .split("\n")
    .map(line => {
      const match = line.match(LUMEN_CATALOG_ENTRY);
      return match ? match[1] + bump(file, match[2], match[3]) + match[4] : line;
    });
  writeFileSync(file, lines.join("\n"));
};

manifestsIn(".").forEach(bumpManifest);
if (existsSync("pnpm-workspace.yaml")) bumpCatalog("pnpm-workspace.yaml");
console.log(changes.join("\n") || "No Lumen version to move.");

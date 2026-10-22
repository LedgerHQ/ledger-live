#!/usr/bin/env node
// Usage: node tools/scripts/renovate-changeset.mjs <base> <name> <title>
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { calculateFileChanges } from "nx/src/project-graph/file-utils.js";

// Apps bundle their devDependencies; other packages only ship their runtime deps.
const MINOR = new Set(["ledger-live-desktop", "live-mobile"]);

const [base, name, title] = process.argv.slice(2);
if (!base || !name || !title) {
  console.error("Usage: renovate-changeset.mjs <base> <name> <title>");
  process.exit(1);
}

// nx's default reader hides git failures, so a bad base could pass as "no change" or "everything changed".
const readFileAtRevision = (file, revision) =>
  execFileSync("git", ["show", `${revision}:${file}`], { encoding: "utf8", maxBuffer: 1 << 30 });

const [lockfile] = calculateFileChanges(
  ["pnpm-lock.yaml"],
  { base, head: "HEAD" },
  readFileAtRevision,
);
const changes = lockfile.getChanges();
if (changes.some(change => !change.path))
  throw new Error(`Could not diff pnpm-lock.yaml against ${base}`);
const importers = new Map();
for (const { path, value } of changes) {
  if (path?.[0] !== "importers" || path.length < 3) continue;
  const [, dir, section, dependency, field] = path;
  const importer = importers.get(dir) ?? { sections: new Set(), updates: new Map() };
  importers.set(dir, importer);
  importer.sections.add(section);
  const version = field === "version" && value.rhs?.replace(/\(.*$/, "");
  if (version && !version.startsWith("link:") && version !== value.lhs?.replace(/\(.*$/, ""))
    importer.updates.set(dependency, version);
}

const released = [...importers]
  .filter(([dir]) => dir !== "." && existsSync(`${dir}/package.json`))
  .map(([dir, importer]) => ({
    ...importer,
    bundled: dir.startsWith("apps/"),
    pkg: JSON.parse(readFileSync(`${dir}/package.json`, "utf8")),
  }))
  .filter(({ pkg }) => pkg.name && pkg.version)
  .filter(({ bundled, sections }) => bundled || [...sections].some(s => s !== "devDependencies"))
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));

if (released.length > 0) {
  const header = released.map(
    ({ pkg }) => `"${pkg.name}": ${MINOR.has(pkg.name) ? "minor" : "patch"}`,
  );
  const details = [
    ...new Set(
      released
        .flatMap(({ updates }) => [...updates])
        .map(([d, v]) => `- Updated \`${d}\` to \`${v}\``),
    ),
  ].sort();
  writeFileSync(
    `.changeset/${name}.md`,
    `---\n${header.join("\n")}\n---\n\n${[title, "", ...details].join("\n").trim()}\n`,
  );
} else {
  rmSync(`.changeset/${name}.md`, { force: true });
}
console.log(
  released.length
    ? `.changeset/${name}.md:\n${released.map(({ pkg }) => pkg.name).join("\n")}`
    : "No workspace package changed.",
);

#!/usr/bin/env node
// Usage: node tools/scripts/check-packed-packages.mjs (after building the libs)
// Fails when a file referenced by a public lib's package.json entry points exists on disk but is left out of its tarball.
import { execFile, execFileSync } from "node:child_process";
import { globSync, readFileSync, statSync } from "node:fs";
import { relative } from "node:path";
import { promisify } from "node:util";

const pnpm = promisify(execFile).bind(null, "pnpm");

const collectTargets = (value, out = new Set()) => {
  if (typeof value === "string") {
    out.add(value.replace(/^\.\//, ""));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value))
      if (k !== "@ledgerhq/source") collectTargets(v, out);
  }
  return out;
};

const isFile = (cwd, file) => statSync(`${cwd}/${file}`, { throwIfNoEntry: false })?.isFile();

// Expands a target to the files it resolves to on disk; exports "*" spans directories, unlike a glob "*".
const onDisk = (cwd, target, extensionless) => {
  if (target.includes("*"))
    return globSync(target.replaceAll("*", "**/*"), { cwd }).filter(file => isFile(cwd, file));
  const candidates = extensionless
    ? [target, `${target}.d.ts`, `${target}.js`, `${target}/index.d.ts`, `${target}/index.js`]
    : [target];
  return candidates.filter(file => isFile(cwd, file));
};

const check = async ({ name, path }) => {
  const pkg = JSON.parse(readFileSync(`${path}/package.json`, "utf8"));
  const { stdout } = await pnpm(["pack", "--dry-run", "--json"], { cwd: path, maxBuffer: 1 << 30 });
  const packed = new Set(JSON.parse(stdout).files.map(f => f.path));
  // Root entry points must always be packed, so an unbuilt package fails too.
  const expected = new Set(collectTargets([pkg.main, pkg.module, pkg.types, pkg.typings]));
  for (const t of collectTargets([pkg.bin, pkg.exports]))
    onDisk(path, t).forEach(f => expected.add(f));
  for (const t of collectTargets(pkg.typesVersions))
    onDisk(path, t, true).forEach(f => expected.add(f));
  return { name, packed, missing: [...expected].filter(f => !packed.has(f)) };
};

// Public packages under libs/, which the release workflows build before publishing.
const packages = JSON.parse(
  execFileSync("pnpm", ["ls", "-r", "--depth", "-1", "--json"], { encoding: "utf8" }),
).filter(p => !p.private && relative(process.cwd(), p.path).startsWith("libs/"));

const results = [];
for (let i = 0; i < packages.length; i += 8) {
  results.push(...(await Promise.all(packages.slice(i, i + 8).map(check))));
}

const failures = results.filter(r => r.missing.length);
for (const { name, packed, missing } of results) {
  if (missing.length)
    console.error(
      `✗ ${name}: tarball is missing ${missing.length} file(s): ${missing.slice(0, 5).join(", ")}`,
    );
  else console.log(`✓ ${name} (${packed.size} files)`);
}

if (failures.length) {
  console.error(`\n${failures.length} package(s) would be published without their entry points.`);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Checks the `.pnpmfile.cjs` patch list against `pnpm-lock.yaml` without running an install.
 *
 * Fails when a patch targets a package that is no longer in the dependency graph, or when a
 * patch has no justification. Patches that still fire but became redundant upstream cannot be
 * detected statically — the `afterAllResolved` hook in `.pnpmfile.cjs` reports those instead.
 */

const fs = require("fs");
const path = require("path");
const { patches } = require("../../.pnpmfile.cjs");

const lockfilePath = path.join(__dirname, "..", "..", "pnpm-lock.yaml");
const lockfile = fs.readFileSync(lockfilePath, "utf8");

/*
  Only `packages:` holds the resolved graph. Scanning the whole file would also hit sections like
  `patchedDependencies:`, which uses the same `  name@version:` shape — a dead patch on a package
  we happen to carry a patch file for would keep looking alive.
*/
function resolvedPackageNames() {
  const lines = lockfile.split("\n");
  const start = lines.indexOf("packages:");
  if (start === -1) throw new Error("no `packages:` section in pnpm-lock.yaml");

  const names = new Set();
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // reached the next top-level section
    const entry = /^ {2}'?((?:@[^/]+\/)?[^'@\s]+)@[^\s']*'?:/.exec(line);
    if (entry) names.add(entry[1]);
  }
  return names;
}

const names = resolvedPackageNames();
const errors = [];

for (const patch of patches) {
  const target = patch.target;
  const label = target instanceof RegExp ? String(target) : target;

  if (!patch.why || !patch.why.trim()) {
    errors.push(`${label} has no \`why\`. Explain what the package fails to declare.`);
  }
  if (!patch.add && !patch.remove) {
    errors.push(`${label} declares neither \`add\` nor \`remove\`.`);
  }

  const matches =
    target instanceof RegExp ? [...names].some(name => target.test(name)) : names.has(target);

  if (!matches) {
    errors.push(
      target instanceof RegExp
        ? `${label} matches no package in pnpm-lock.yaml anymore — the patch is dead, remove it.`
        : `${label} is not in pnpm-lock.yaml anymore — the patch is dead, remove it.`,
    );
  }
}

if (errors.length) {
  console.error("The .pnpmfile.cjs patch list is out of date:\n");
  errors.forEach(error => console.error(`  ✖ ${error}`));
  console.error("");
  process.exit(1);
}

console.log(`${patches.length} patches checked against ${names.size} resolved packages, all live`);

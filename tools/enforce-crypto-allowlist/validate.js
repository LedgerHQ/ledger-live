"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { patterns, implementations } = require("./allowlist.json");

const WORKSPACE_ROOT = path.join(__dirname, "..", "..");
const ALLOWLIST_FILE = "tools/enforce-crypto-allowlist/allowlist.json";
const IGNORED_BUILDS_HEADER = "Automatically ignored builds during installation:";
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "unsavedDependencies",
];

function toRegExp(glob) {
  if (/[?!{}[\]]/.test(glob)) {
    throw new Error(
      `${ALLOWLIST_FILE}: pattern ${JSON.stringify(glob)} uses glob syntax beyond "*". ` +
        `pnpm would honour it but this check would not, so the pattern would match nothing here.`,
    );
  }
  const escape = literal => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${glob.split("*").map(escape).join(".*")}$`);
}

function isWatched(name, globs = patterns) {
  return globs.some(glob => toRegExp(glob).test(name));
}

function collectWatched(tree, globs) {
  const found = new Map();

  const walk = (dependencies, chain) => {
    for (const [name, node] of Object.entries(dependencies ?? {})) {
      const next = [...chain, name];
      if (isWatched(name, globs) && !found.has(name)) found.set(name, next.join(" > "));
      walk(node.dependencies, next);
    }
  };

  for (const project of tree) {
    const declared = DEPENDENCY_FIELDS.map(field => project[field]);
    walk(Object.assign({}, ...declared), [project.name]);
  }
  return found;
}

function findIncompleteEntries(known = implementations) {
  return Object.entries(known).flatMap(([name, entry]) => {
    if (!entry.reason) return [`${name} is classified without a reason`];
    if (entry.tolerated && !entry.exit) return [`${name} is tolerated without an exit condition`];
    return [];
  });
}

function findViolations(watched, blockedBuilds, known = implementations) {
  const violations = findIncompleteEntries(known);

  for (const [name, chain] of [...watched].sort()) {
    if (!known[name]) violations.push(`${name} entered the tree: ${chain}`);
    else if (known[name].mustNotBuild && !blockedBuilds.includes(name)) {
      violations.push(`${name} is approved to build native bindings, and must not be`);
    }
  }

  for (const [name, entry] of Object.entries(known)) {
    if (entry.tolerated && !watched.has(name)) {
      violations.push(`${name} has left the tree — delete its entry`);
    }
  }

  return violations;
}

function parseIgnoredBuilds(output) {
  const lines = output.split("\n").map(line => line.replace(/\r$/, ""));
  if (!lines.includes(IGNORED_BUILDS_HEADER)) {
    throw new Error(
      `could not read "pnpm ignored-builds": expected a ${JSON.stringify(IGNORED_BUILDS_HEADER)} ` +
        `line. pnpm's output format changed, so ${ALLOWLIST_FILE}'s mustNotBuild entries cannot ` +
        `be checked.\n\n${output}`,
    );
  }
  return lines.flatMap(line => line.match(/^ {2}(\S+)$/)?.slice(1) ?? []);
}

function inspect(cwd = WORKSPACE_ROOT) {
  const pnpm = (...args) =>
    execFileSync("pnpm", args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

  const watched = collectWatched(
    JSON.parse(pnpm("list", "-r", "--depth", "Infinity", "--json", ...patterns)),
  );
  if (watched.size === 0) {
    throw new Error(
      `"pnpm list" reported no curve implementation at all, not even @noble/curves. The query is ` +
        `broken or the workspace is not installed — run "pnpm i" rather than trusting this result.`,
    );
  }

  return { watched, blockedBuilds: parseIgnoredBuilds(pnpm("ignored-builds")) };
}

function main() {
  const { watched, blockedBuilds } = inspect();
  const violations = findViolations(watched, blockedBuilds);

  if (violations.length === 0) {
    console.log(`✓ secp256k1 allowlist ok (${watched.size} implementations, all classified)`);
    return;
  }

  console.error(`\n✗ ${violations.length} secp256k1 allowlist violation(s):\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    `\nThe monorepo converges on @noble/curves (LIVE-37372). If the dependency is unavoidable,` +
      `\nclassify it in ${ALLOWLIST_FILE} with a reason and an exit condition.\n`,
  );
  process.exit(1);
}

module.exports = {
  isWatched,
  collectWatched,
  findIncompleteEntries,
  findViolations,
  parseIgnoredBuilds,
  inspect,
};

if (require.main === module) main();

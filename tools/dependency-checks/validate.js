"use strict";

const { allowlists, singletons } = require("./config.json");

const CONFIG_FILE = "tools/dependency-checks/config.json";
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];

function toRegExp(glob) {
  if (/[?!{}[\]]/.test(glob)) {
    throw new Error(
      `${CONFIG_FILE}: pattern ${JSON.stringify(glob)} uses glob syntax beyond "*". ` +
        `pnpm would honour it but this check would not, so the pattern would match nothing here.`,
    );
  }
  const escape = literal => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${glob.split("*").map(escape).join(".*")}$`);
}

function matchesPatterns(name, patterns) {
  return patterns.some(glob => toRegExp(glob).test(name));
}

function parseDepPath(depPath) {
  const match = depPath.match(/^(@[^/]+\/[^@]+|[^@]+)@([^(]+)/);
  return match ? { name: match[1], version: match[2] } : null;
}

function packageTable(lockfile) {
  return lockfile.packages ?? lockfile.snapshots ?? {};
}

function graphTable(lockfile) {
  return lockfile.snapshots ?? lockfile.packages ?? {};
}

function lookupNode(lockfile, depPath) {
  const graph = graphTable(lockfile);
  if (graph[depPath]) return graph[depPath];
  const prefix = `${depPath}(`;
  for (const key of Object.keys(graph)) {
    if (key.startsWith(prefix)) return graph[key];
  }
  return undefined;
}

function resolvedDependencies(node) {
  const refs = Object.assign({}, ...DEPENDENCY_FIELDS.map(field => node[field]));
  return Object.entries(refs).map(([name, ref]) => [
    name,
    typeof ref === "string" ? ref : ref.version,
  ]);
}

function collectResolvedVersions(lockfile) {
  const versionsByName = new Map();

  for (const depPath of Object.keys(packageTable(lockfile))) {
    const parsed = parseDepPath(depPath);
    if (!parsed) continue;
    const versions = versionsByName.get(parsed.name) ?? new Set();
    versions.add(parsed.version);
    versionsByName.set(parsed.name, versions);
  }

  return versionsByName;
}

function shortestChains(lockfile, patterns) {
  const chains = new Map();
  const visited = new Set();
  const queue = Object.entries(lockfile.importers ?? {}).map(([importerId, importer]) => ({
    node: importer,
    chain: [importerId],
  }));

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const { node, chain } = queue[cursor];

    for (const [name, ref] of resolvedDependencies(node)) {
      const chainToDependency = [...chain, name];
      if (matchesPatterns(name, patterns) && !chains.has(name)) {
        chains.set(name, chainToDependency.join(" > "));
      }

      const depPath = `${name}@${ref}`;
      if (visited.has(depPath)) continue;
      const next = lookupNode(lockfile, depPath);
      if (!next) continue;
      visited.add(depPath);
      queue.push({ node: next, chain: chainToDependency });
    }
  }

  return chains;
}

function collectMatches(lockfile, patterns) {
  const chains = shortestChains(lockfile, patterns);
  const found = new Map();

  for (const depPath of Object.keys(packageTable(lockfile))) {
    const name = parseDepPath(depPath)?.name;
    if (!name || !matchesPatterns(name, patterns) || found.has(name)) continue;
    found.set(name, chains.get(name) ?? depPath);
  }

  return found;
}

function findIncompleteEntries(allowed) {
  return Object.entries(allowed).flatMap(([name, entry]) => {
    if (!entry.reason) return [`${name} is listed without a reason`];
    if (entry.tolerated && !entry.exit) return [`${name} is tolerated without an exit condition`];
    return [];
  });
}

function findAllowlistViolations(group, lockfile) {
  const matched = collectMatches(lockfile, group.patterns);
  const allowed = group.packages;
  const violations = findIncompleteEntries(allowed);

  for (const [name, chain] of [...matched].sort()) {
    if (!allowed[name]) violations.push(`${name} entered the tree: ${chain}`);
  }

  for (const [name, entry] of Object.entries(allowed)) {
    if (entry.target && !matched.has(name)) {
      violations.push(`${name} is the package this group converges on, and it left the tree`);
    }
    if (entry.tolerated && !matched.has(name)) {
      violations.push(`${name} has left the tree — delete its entry`);
    }
  }

  return violations;
}

function findSingletonViolations(name, rule, versionsByName) {
  const maxVersions = rule.maxVersions ?? 1;
  const versions = [...(versionsByName.get(name) ?? [])].sort();
  if (versions.length <= maxVersions) return [];
  return [
    `${name} resolved to ${versions.length} versions (${versions.join(", ")}); max is ${maxVersions}`,
  ];
}

function withoutStackTrace(error) {
  error.stack = error.message;
  return error;
}

function assertDependencyChecks(lockfile) {
  const versionsByName = collectResolvedVersions(lockfile);
  const failures = [
    ...Object.entries(allowlists ?? {}).map(([groupName, group]) => ({
      groupName,
      why: group.why,
      violations: findAllowlistViolations(group, lockfile),
    })),
    ...Object.entries(singletons ?? {}).map(([name, rule]) => ({
      groupName: name,
      why: rule.why,
      violations: findSingletonViolations(name, rule, versionsByName),
    })),
  ].filter(({ violations }) => violations.length > 0);

  if (failures.length === 0) return;

  const total = failures.reduce((count, { violations }) => count + violations.length, 0);

  throw withoutStackTrace(
    new Error(
      [
        `${total} dependency check violation(s):`,
        ...failures.flatMap(({ groupName, why, violations }) => [
          "",
          `${groupName} — ${why}`,
          ...violations.map(violation => `  ${violation}`),
        ]),
        "",
        `If the dependency is unavoidable, update ${CONFIG_FILE}.`,
      ].join("\n"),
    ),
  );
}

module.exports = { assertDependencyChecks };

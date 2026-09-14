function bold(str, colorCode = "") {
  return "\033" + `[1${colorCode ? `;${colorCode}` : ""}m` + str + "\033[0;0m";
}

function field(str, { length = 36, bolden = true } = {}) {
  const paddedField = ("[" + str + "]").padEnd(length);
  return bolden ? bold(paddedField) : paddedField;
}

const memoMap = new Map();

// Records what each patch actually did during a resolution, so `.pnpmfile.cjs` can report
// the ones that never fired or that a package now declares on its own.
const auditRegistry = new Map();
function track(filter, kind) {
  const key = `${filter instanceof RegExp ? String(filter) : filter} (${kind})`;
  if (!auditRegistry.has(key))
    auditRegistry.set(key, { key, matched: 0, applied: new Set(), noop: new Set() });
  return auditRegistry.get(key);
}

function getPatchReport() {
  const never = [];
  const noop = [];
  for (const entry of auditRegistry.values()) {
    if (entry.matched === 0) {
      never.push(entry.key);
      continue;
    }
    for (const dep of entry.noop) {
      if (!entry.applied.has(dep)) noop.push(`${entry.key} → ${dep}`);
    }
  }
  return { never, noop };
}

function addDependencies(
  filter,
  dependencies,
  {
    kind = "dependencies",
    matchDevVersion = true,
    ignoreExisting = false,
    filterOnPkg = null,
    silent = false,
  } = {},
) {
  const audit = track(filter, kind);
  return (pkg, context) => {
    if (filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter) {
      if (filterOnPkg && !filterOnPkg(pkg)) {
        return;
      }
      audit.matched++;
      const key = `${pkg.name}@${pkg.version}`;
      if (!memoMap.has(key)) memoMap.set(key, new Set());
      const visitedDeps = memoMap.get(key);

      if (!pkg[kind]) pkg[kind] = {};

      Object.entries(dependencies).forEach(([dep, depVersion]) => {
        const devVersion = pkg?.devDependencies?.[dep];
        const version = (matchDevVersion && devVersion) || depVersion || "*";
        const depKey = `${dep}@${version}`;

        if (visitedDeps.has(depKey)) return;
        visitedDeps.add(depKey);

        if (pkg[kind][dep]) {
          if (!ignoreExisting) {
            audit.noop.add(dep);
            !silent &&
              console.log(
                `${bold("[!]", 33)} ${field(depKey)} | ${field(key, {
                  length: 0,
                })} already declares ${dep}@${pkg[kind][dep]} (${kind})`,
              );
            return;
          }
        }

        audit.applied.add(dep);
        !silent && console.log(`${bold("[+]", 32)} ${field(depKey)} | ${field(key)} (${kind})`);

        if (kind === "peerDependencies") {
          pkg.peerDependenciesMeta = {
            ...(pkg.peerDependenciesMeta || {}),
            [dep]: {
              optional: true,
            },
          };
        }

        pkg[kind] = {
          ...pkg[kind],
          [dep]: version,
        };
      });
    }
  };
}

function removeDependencies(filter, dependencies, { kind = "dependencies" } = {}) {
  const audit = track(filter, kind);
  return (pkg, context) => {
    const key = `${pkg.name}@${pkg.version}`;
    if (filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter) {
      audit.matched++;
      dependencies.forEach(dependency => {
        let removed = false;
        if (pkg[kind]?.[dependency]) {
          removed = true;
          console.log(`${bold("[-]", 31)} ${field(dependency)} | ${field(key)} (${kind})`);
          delete pkg[kind][dependency];
        }
        if (
          pkg.peerDependenciesMeta &&
          kind === "peerDependencies" &&
          pkg.peerDependenciesMeta[dependency]
        ) {
          removed = true;
          console.log(
            `${bold("[-]", 31)} ${field(dependency)} | ${field(key)} (peerDependenciesMeta)`,
          );
          delete pkg.peerDependenciesMeta[dependency];
        }
        (removed ? audit.applied : audit.noop).add(dependency);
      });
    }
  };
}

function process(fns, pkg, context) {
  fns.forEach(fn => fn(pkg, context));
}

function addDevDependencies(filter, dependencies, options = {}) {
  return addDependencies(filter, dependencies, {
    ...options,
    kind: "devDependencies",
  });
}
function addPeerDependencies(filter, dependencies, options = {}) {
  return addDependencies(filter, dependencies, {
    ...options,
    kind: "peerDependencies",
  });
}

module.exports = {
  getPatchReport,
  process,
  addDependencies,
  addDevDependencies,
  addPeerDependencies,
  removeDependencies,
};

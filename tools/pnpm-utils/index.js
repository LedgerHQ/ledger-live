function bold(str, colorCode = "") {
  return "\033" + `[1${colorCode ? `;${colorCode}` : ""}m` + str + "\033[0;0m";
}

function field(str, { length = 36, bolden = true } = {}) {
  const paddedField = ("[" + str + "]").padEnd(length);
  return bolden ? bold(paddedField) : paddedField;
}

const memoMap = new Map();
function addDependencies(
  filter,
  dependencies,
  {
    kind = "dependencies",
    matchDevVersion = true,
    ignoreExisting = false,
    filterOnPkg = null,
    silent = false,
  } = {}
) {
  return (pkg, context) => {
    if (
      filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter
    ) {
      if (filterOnPkg && !filterOnPkg(pkg)) {
        return;
      }
      const key = `${pkg.name}@${pkg.version}`;
      if (!memoMap.has(key)) memoMap.set(key, new Set());
      const visitedDeps = memoMap.get(key);

      if (!pkg[kind]) pkg[kind] = {};

      Object.entries(dependencies).forEach(([dep, depVersion]) => {
        const devVersion = pkg?.devDependencies?.[dep];
        const version = (matchDevVersion && devVersion) ?? depVersion ?? "*";
        const depKey = `${dep}@${version}`;

        if (visitedDeps.has(depKey)) return;
        visitedDeps.add(depKey);

        if (pkg[kind][dep]) {
          if (!ignoreExisting) {
            !silent &&
              console.log(
                `${bold("[!]", 33)} ${field(depKey)} | ${field(key, {
                  length: 0,
                })} already declares ${dep}@${pkg[kind][dep]} (${kind})`
              );
            return;
          }
        }

        !silent &&
          console.log(
            `${bold("[+]", 32)} ${field(depKey)} | ${field(key)} (${kind})`
          );

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

function removeDependencies(
  filter,
  dependencies,
  { kind = "dependencies" } = {}
) {
  return (pkg, context) => {
    const key = `${pkg.name}@${pkg.version}`;
    if (
      filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter
    ) {
      dependencies.forEach((dependency) => {
        if (pkg[kind][dependency]) {
          console.log(
            `${bold("[-]", 31)} ${field(dependency)} | ${field(key)} (${kind})`
          );
          delete pkg[kind][dependency];
        }
        if (
          pkg.peerDependenciesMeta &&
          kind === "peerDependencies" &&
          pkg.peerDependenciesMeta[dependency]
        ) {
          console.log(
            `${bold("[-]", 31)} ${field(dependency)} | ${field(
              key
            )} (peerDependenciesMeta)`
          );
          delete pkg.peerDependenciesMeta[dependency];
        }
      });
    }
  };
}

function process(fns, pkg, context) {
  fns.forEach((fn) => fn(pkg, context));
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
  process,
  addDependencies,
  addDevDependencies,
  addPeerDependencies,
  removeDependencies,
};

const mutatedDependencies = new Set()
function addDependencies(filter, dependencies, {
  kind = "dependencies",
  matchDevVersion = true,
  ignoreExisting = false
} = {}) {
  return (pkg, context) => {
    if (filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter) {
      const key = `${pkg.name}@${pkg.version}`
      if (mutatedDependencies.has(key)) {
        return
      }
      mutatedDependencies.add(key)

      if (!pkg[kind])
        pkg[kind] = {}

      Object.entries(dependencies).forEach(([dep, depVersion]) => {
        const devVersion = pkg?.devDependencies?.[dep]
        const version = devVersion ?? depVersion ?? "*"

        if (pkg[kind][dep]) {
          if (!ignoreExisting) {
            context.log(`/!\\ ${pkg.name}@${pkg.version} already declares ${dep} with version [${pkg[kind][dep]}] (tried to set version [${version}]).`)
            return
          }
        }

        context.log(`Adding ${dep}@${version} to the ${kind} of: ${pkg.name}@${pkg.version}.`)

        pkg[kind] = {
          ...pkg[kind],
          [dep]: version
        }
      })
    }
  }
}

function removePeerDeps(filter) {
  return (pkg, context) => {
    if (filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter) {
      context.log(`Removing peer dependencies from: ${pkg.name}@${pkg.version}.`)
      delete pkg.peerDependencies;
      delete pkg.peerDependenciesMeta;
    }
  }
}

function process(fns, pkg, context) {
  fns.forEach(fn => fn(pkg, context))
}

module.exports = {
  process,
  addDependencies,
  removePeerDeps
}
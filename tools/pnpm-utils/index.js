function bold(str) {
  return "\033[1m" + str + "\033[0;0m";
}

function pad(str, length) {
  return str.padEnd(length)
}

function field(str, { length = 30, bolden = true } = {}) {
  const paddedField = pad("[" + str + "]", length)
  return bolden ? bold(paddedField) : paddedField
}

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
        const depKey = `${dep}@${version}`

        if (pkg[kind][dep]) {
          if (!ignoreExisting) {
            context.log(`[!] ${field(depKey)} | ${field(key, { length: 0 })} already declares version ${pkg[kind][dep]} (${kind})`)
            return
          }
        }

        context.log(`[+] ${field(depKey)} | ${field(key)} (${kind})`)

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
    const key = `${pkg.name}@${pkg.version}`
    if (filter instanceof RegExp ? filter.test(pkg?.name) : pkg.name === filter) {
      context.log(`[-] ${field(key)} | (peerDependencies)`)
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
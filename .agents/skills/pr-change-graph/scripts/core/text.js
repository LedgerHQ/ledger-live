/**
 * @param {string} a
 * @param {string} b
 */
export function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Path inside a folder, the repository root being "".
 * @param {string} dir
 * @param {string} name
 */
export function join(dir, name) {
  return dir ? `${dir}/${name}` : name;
}

/**
 * Path of a file in its package: under `src/` without that prefix, otherwise from the package root.
 * @param {string} rel
 * @param {string} dir
 */
export function labelInPackage(rel, dir) {
  const inPackage = dir ? rel.slice(dir.length + 1) : rel;
  return inPackage.startsWith("src/") ? inPackage.slice("src/".length) : `/${inPackage}`;
}

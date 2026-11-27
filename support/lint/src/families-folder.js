import fs from "node:fs";
import path from "node:path";

const appRootCache = new Map();

/**
 * The app that owns `dir`: its nearest ancestor holding a package.json. `cwd` is not available to
 * a plugin's `createOnce`, so the folder is found from the file being linted.
 *
 * @param {string} dir
 * @returns {string | null}
 */
function appRoot(dir) {
  if (appRootCache.has(dir)) return appRootCache.get(dir);

  let root = null;
  if (fs.existsSync(path.join(dir, "package.json"))) root = dir;
  else {
    const parent = path.dirname(dir);
    if (parent !== dir) root = appRoot(parent);
  }

  appRootCache.set(dir, root);
  return root;
}

/**
 * @param {string} filename
 * @param {string | undefined} familiesDir
 * @returns {boolean} whether the file is part of the families folder, where coin code is the point
 */
function isInFamilies(filename, familiesDir) {
  const root = appRoot(path.dirname(filename));
  if (!root || !familiesDir) return false;
  const below = path.relative(path.join(root, familiesDir), filename);
  return !below.startsWith("..") && !path.isAbsolute(below);
}

export { appRoot, isInFamilies };

const path = require("path");
const fs = require("fs-extra");

// Given a module subfolder, finds the nearest root.
// A root is a parent folder containing a package.json file.
function findPackageRoot(folder) {
  const paths = folder.split(path.sep);
  while(paths.length > 0) {
    const subPath = paths.join(path.sep);
    if(fs.existsSync(path.resolve(subPath, "package.json")))
      return subPath;
    paths.pop();
  }
  return null
}

// Given a module root, crawls its production dependencies and find every module exposing native node.js addons.
function findNativeModules(root) {
  const nativeModules = [];
  const stack = [root];
  const guard = new Set();
  let currentPath = null;

  while((currentPath = stack.shift())) {
    const package = JSON.parse(fs.readFileSync(path.resolve(currentPath, "package.json")).toString());
    // A module is considered native if it contains a binding.gyp file.
    const isNative = fs.existsSync(path.resolve(currentPath, "binding.gyp"));
    if(isNative) {
      nativeModules.push(currentPath);
    }
    const dependencies = package.dependencies || [];
    Object.keys(dependencies).forEach(dependency => {
      // Symlinks must be resolved otherwise node.js will fail to resolve.
      const realPath = fs.realpathSync([currentPath]);
      let resolvedPath = null;
      try {
        resolvedPath = require.resolve(dependency, { paths: [realPath] });
      } catch(_) {
        try {
          resolvedPath = require.resolve(dependency + "/package.json", { paths: [realPath]});
        } catch(error) {
          // swallow the error
          // console.error(error)
          return
        }
      }

      if(!resolvedPath || !resolvedPath.startsWith("/")) {
        return
      }


      const depPath = findPackageRoot(resolvedPath);

      // The guard check prevents infinite loops caused by cyclic dependencies.
      if(depPath && !guard.has(depPath)) {
        stack.push(depPath);
        guard.add(depPath);
      }
    })
  }

  return nativeModules;
}

// Copy a module to a target location and exposes some options to handle renaming.
function copyNodeModule(modulePath, { root, destination = "", appendVersion = false } = {}) {
  const source = root ? path.resolve(root, modulePath) : modulePath;
  const package = JSON.parse(fs.readFileSync(path.resolve(source, "package.json")).toString());
  const { name, version } = package
  const target = path.resolve(destination, "node_modules", appendVersion ? name + "@" + version : name);
  fs.copySync(source, target, { dereference: true });
  return { name, version, source, target };
}

// Creates a full production dependency tree object for a given module.
function dependencyTree(modulePath, { root } = {}) {
  const rootPath = root ? path.resolve(root, modulePath) : modulePath;
  const tree = {};
  const stack = [[rootPath, tree]];
  const guard = new Set();

  let current = null;
  while ((current = stack.shift())) {
    const [currentPath, currentTree] = current;
    const package = JSON.parse(fs.readFileSync(path.resolve(currentPath, "package.json")).toString());
    const dependencies = package.dependencies || [];
    currentTree.module = package.name;
    currentTree.version = package.version;
    currentTree.path = currentPath;
    currentTree.dependencies = [];

    // Prevents infinite loops caused by cyclic dependencies.
    if(!guard.has(currentPath)) {
      guard.add(currentPath);
      Object.keys(dependencies).forEach(dependency => {
        try {
          // console.log("Requiring: ", dependency)
          // console.log("Paths: ", [currentPath])
          const resolvedPath = require.resolve(dependency, { paths: [fs.realpathSync(currentPath)]});
          if(!resolvedPath || !resolvedPath.startsWith("/")) {
            return
          }
          const depPath = findPackageRoot(resolvedPath);
          // console.log("depPath: ", depPath)
          const depTree = {};
          if(depPath) {
            currentTree.dependencies.push(depTree);
            stack.push([depPath, depTree])
          }
        } catch(error) {
          // swallow the error
          // console.error(error)
          return
        }
      })
    }
  }

  return tree;
}

// Populates an 'externals' object given a list of native modules.
// See: https://webpack.js.org/configuration/externals
function buildWebpackExternals(nativeModules) {

  return function({ context, request }, callback) {
    try {
      const resolvedPath = require.resolve(request, { paths: [context]});
      const realResolvedPath = fs.realpathSync(resolvedPath);
      const resolvedRoot = findPackageRoot(realResolvedPath);
      const nativeModule = nativeModules[resolvedRoot]
      if (nativeModule) {
        return callback(null, "commonjs " + nativeModule.name + "@" + nativeModule.version)
      }
    } catch (error) {
      // swallow error
      // console.error(error);
    }

    callback();
  }
}

module.exports = {
  findNativeModules,
  copyNodeModule,
  dependencyTree,
  buildWebpackExternals
}

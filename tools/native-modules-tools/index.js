const path = require("path");
const fs = require("fs");

// Copy a folder and its contents recursively.
function copyFolderRecursivelySync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.statSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.statSync(curSource).isDirectory()) {
        copyFolderRecursivelySync(curSource, path.join(target, file));
      } else {
        fs.copyFileSync(curSource, path.join(target, path.basename(file)));
      }
    });
  }
}

// Given a module subfolder, finds the nearest root.
// A root is a parent folder containing a package.json file.
function findPackageRoot(folder) {
  const paths = folder.split(path.sep);
  while (paths.length > 0) {
    const subPath = paths.join(path.sep);
    if (fs.existsSync(path.resolve(subPath, "package.json"))) return subPath;
    paths.pop();
  }
  return null;
}

// Given a module root, crawls its production dependencies and find every module exposing native node.js addons.
function findNativeModules(root) {
  const nativeModules = [];
  const stack = [root];
  const guard = new Set();
  let currentPath = null;

  while ((currentPath = stack.shift())) {
    const package = JSON.parse(
      fs.readFileSync(path.resolve(currentPath, "package.json")).toString()
    );
    // A module is considered native if it contains a binding.gyp file.
    const isNative = fs.existsSync(path.resolve(currentPath, "binding.gyp"));
    if (isNative) {
      nativeModules.push(currentPath);
    }
    const dependencies = package.dependencies || [];
    Object.keys(dependencies).forEach((dependency) => {
      // Symlinks must be resolved otherwise node.js will fail to resolve.
      const realPath = fs.realpathSync([currentPath]);
      let resolvedPath = null;
      try {
        resolvedPath = require.resolve(dependency, { paths: [realPath] });
      } catch (_) {
        try {
          resolvedPath = require.resolve(
            path.resolve(dependency, "package.json"),
            {
              paths: [realPath],
            }
          );
        } catch (error) {
          // swallow the error
          // console.error(error)
          return;
        }
      }

      if (!resolvedPath || !path.isAbsolute(resolvedPath)) {
        return;
      }

      const depPath = findPackageRoot(resolvedPath);

      // The guard check prevents infinite loops caused by circular dependencies.
      if (depPath && !guard.has(depPath)) {
        stack.push(depPath);
        guard.add(depPath);
      }
    });
  }

  return nativeModules;
}

// Copy a module to a target location and exposes some options to handle renaming.
function copyNodeModule(
  modulePath,
  { root, destination = "", appendVersion = false } = {}
) {
  const source = root ? path.resolve(root, modulePath) : modulePath;
  const package = JSON.parse(
    fs.readFileSync(path.resolve(source, "package.json")).toString()
  );
  const { name, version } = package;
  const target = path.resolve(
    destination,
    "node_modules",
    appendVersion ? name + "@" + version : name
  );
  copyFolderRecursivelySync(source, target);
  return { name, version, source, target };
}

// Creates a full production dependency tree object for a given module.
function dependencyTree(modulePath, { root } = {}) {
  const rootPath = root ? path.resolve(root, modulePath) : modulePath;
  const tree = {};
  const stack = [[rootPath, tree]];

  // Crawls up the tree to check if the dependency has already been added.
  // Prevents infinite loops when crawling circular dependencies.
  function isDependencyRequireable(path, tree) {
    if (tree.path === path || tree.dependencies.has(path)) {
      return true;
    }

    if (!tree.parent) {
      return false;
    }

    return isDependencyRequireable(path, tree.parent);
  }

  let current = null;
  while ((current = stack.shift())) {
    const [currentPath, currentTree] = current;
    const package = JSON.parse(
      fs.readFileSync(path.resolve(currentPath, "package.json")).toString()
    );
    const dependencies = package.dependencies || [];
    currentTree.module = package.name;
    currentTree.version = package.version;
    currentTree.path = currentPath;
    currentTree.dependencies = new Map();

    Object.keys(dependencies).forEach((dependency) => {
      try {
        // console.log("Requiring: ", dependency)
        // console.log("Paths: ", [currentPath])
        const resolvedPath = require.resolve(dependency, {
          paths: [fs.realpathSync(currentPath)],
        });
        if (!resolvedPath || !path.isAbsolute(resolvedPath)) {
          return;
        }
        const depPath = findPackageRoot(resolvedPath);
        // console.log("depPath: ", depPath)
        const depTree = {
          parent: currentTree,
        };
        if (depPath && !isDependencyRequireable(depPath, currentTree)) {
          currentTree.dependencies.set(depPath, depTree);
          stack.push([depPath, depTree]);
        }
      } catch (error) {
        // swallow the error
        // console.error(error)
        return;
      }
    });
  }

  return tree;
}

// Populates an 'externals' function given a list of native modules.
// See: https://webpack.js.org/configuration/externals
function buildWebpackExternals(nativeModules) {
  return function ({ context, request }, callback) {
    try {
      const resolvedPath = require.resolve(request, { paths: [context] });
      const realResolvedPath = fs.realpathSync(resolvedPath);
      const resolvedRoot = findPackageRoot(realResolvedPath);
      const nativeModule = nativeModules[resolvedRoot];
      if (nativeModule) {
        return callback(
          null,
          "commonjs " + nativeModule.name + "@" + nativeModule.version
        );
      }
    } catch (error) {
      // swallow error
      // console.error(error);
    }

    callback();
  };
}

// Populates an 'externals' plugin given a list of native modules.
// See: https://esbuild.github.io/plugins/#on-resolve
function esBuildExternalsPlugin(nativeModules) {
  return {
    name: "Externals Plugin (native-modules-tools)",
    setup(build) {
      Object.values(nativeModules).forEach((module) => {
        build.onResolve({ filter: new RegExp(`^${module.name}`) }, (args) => {
          if (args.resolveDir === "") {
            return; // Ignore unresolvable paths
          }
          try {
            const resolvedPath = require.resolve(args.path, {
              paths: [args.resolveDir],
            });
            const realResolvedPath = fs.realpathSync(resolvedPath);
            const resolvedRoot = findPackageRoot(realResolvedPath);
            const nativeModule = nativeModules[resolvedRoot];
            if (nativeModule) {
              return {
                path: args.path.replace(
                  new RegExp(`^${nativeModule.name}`),
                  nativeModule.name + "@" + nativeModule.version
                ),
                external: true,
              };
            }
          } catch (error) {
            // swallow error
            // console.error(error);
          }
        });
      });
    },
  };
}

function processNativeModules({ root, destination, silent = false }) {
  // First, we crawl the production dependencies and find every node.js native modules.
  const nativeModulesPaths = findNativeModules(root);
  if (!silent) {
    console.log("Found the following native modules:", nativeModulesPaths);
  }

  // Then for each one of these native modules…
  const mappedNativeModules = nativeModulesPaths.reduce((acc, module) => {
    // We copy the module to a special directory that will be copied by electron-bundler in place of the node_modules.
    const copyResults = copyNodeModule(module, {
      destination,
      appendVersion: true,
    });
    const { target } = copyResults;
    // Based on the target directory (dist/node_modules/name@version) we crawl the dependencies.
    const tree = dependencyTree(module);
    // And we populate nested node_modules manually (npm-like).
    const stack = [[target, tree.dependencies]];
    let current = null;
    while ((current = stack.shift())) {
      const [path, dependencies] = current;
      Array.from(dependencies.values()).forEach((dependency) => {
        const copyResult = copyNodeModule(dependency.path, {
          destination: path,
        });
        stack.push([copyResult.target, dependency.dependencies]);
      });
    }
    acc[copyResults.source] = copyResults;

    // And finally we return an object containing useful data for the module.
    // (its source/destination directories, name and version)
    // This will be used to tell webpack to treat them as externals and to require from the correct path.
    // (something like 'dist/node_modules/name@version')
    return acc;
  }, {});

  return mappedNativeModules;
}

module.exports = {
  findNativeModules,
  copyNodeModule,
  dependencyTree,
  buildWebpackExternals,
  esBuildExternalsPlugin,
  copyFolderRecursivelySync,
  processNativeModules,
};

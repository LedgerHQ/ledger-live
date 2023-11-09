const fs = require("fs");
const path = require("path");

const TSCONFIG_FILE = "tsconfig.json";
const DEFAULT_BASE_URL = ".";
const FILES_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

/**
 * @dev remove wildcard and what's following it in a string
 */
const pathOnly = path => {
  return path.split("*")[0];
};

/**
 * @description parse a requested module name into its actual module name and the
 * rest of its path.
 *
 * @dev if the requestedModule is "@utils/constants", returns ["@utils", "constants"]
 */
const parseRequestedModule = requestedModule => {
  const [actualModule, ...rest] = requestedModule.split("/");
  return [actualModule, rest.join("/")];
};

/**
 * @description take a `tsconfig.compilerOptions.paths` and creates a lookup
 * mapping with the module name for optimization purpose.
 *
 * @dev if the config is { "@utils/*": [...] } it will return { "@utils": true }
 */
const optimizePath = paths => {
  return Object.keys(paths).reduce((t, requestedModule) => {
    const [moduleName, _] = parseRequestedModule(requestedModule);
    t[moduleName] = true;
    return t;
  }, {});
};

/**
 *
 * @dev This module is designed to parse "paths" in a `tsconfig.json` file located
 * at the root of a TypeScript project. It then provides a function that can
 * be used to resolve files associated with that configuration.
 *
 * @schema tsconfig paths:
 * {
 *   "paths": {
 *     "@utils/*": ["./src/utils/*"],
 *     "@constants/*": ["./src/constants/*"],
 *   }
 * }
 *
 * @note "*" are mandatory in the paths for the resolver to work correctly
 */
module.exports = ({ projectRoot }) => {
  // Fetch tsconfig file
  const tsconfig = require(path.join(projectRoot, TSCONFIG_FILE));

  // Initialize `baseUrl` and `paths`
  const baseUrl = tsconfig.compilerOptions.baseUrl ?? DEFAULT_BASE_URL;
  const paths = tsconfig.compilerOptions.paths;

  // Create an optimized version of `paths`
  const optiPaths = optimizePath(paths);

  // Create a module cache
  const moduleCache = {};

  const resolveCachedModule = module => {
    const cachedModulePath = moduleCache[module];
    return cachedModulePath ?? undefined;
  };

  const setCachedModule = (module, resolvedFile) => {
    moduleCache[module] = resolvedFile;
  };

  // @utils/constants
  const resolve = requestedModule => {
    // ["@utils", "constants"]
    const [moduleName, followingPath] = parseRequestedModule(requestedModule);
    if (!optiPaths[moduleName]) return;

    if (paths[moduleName]?.[0] || paths[moduleName + "/"]?.[0]) {
      // The tsconfig.compilerOptions.paths schema hasn't been respected,
      // check out out the tsconfig @schema exemple above
      return undefined;
    }

    // ./src/utils/*
    const actualPath = paths[moduleName + "/*"]?.[0];
    if (!actualPath) return undefined;

    // ./src/utils/
    const epuratedPath = pathOnly(actualPath);

    // {projectRoot}/{baseUrl}/./src/utils/{followingPath = "constants"}
    const resolvedModulePath = path.join(projectRoot, baseUrl, epuratedPath, followingPath);

    const cachedModulePath = resolveCachedModule(resolvedModulePath);
    if (cachedModulePath) return { filePath: cachedModulePath, type: "sourceFile" };

    // {projectRoot}/./src/utils/{followingPath}.ts
    for (const extension of FILES_EXTENSIONS) {
      const resolvedFile = resolvedModulePath + extension;

      if (fs.existsSync(resolvedFile)) {
        setCachedModule(resolvedModulePath, resolvedFile);

        return {
          filePath: resolvedFile,
          type: "sourceFile",
        };
      }
    }

    return undefined;
  };

  return resolve;
};

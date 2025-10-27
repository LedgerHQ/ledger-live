const fs = require("fs");
const path = require("path");

/**
 * Custom Rspack plugin to handle pnpm workspace module resolution
 * This plugin resolves workspace packages by following pnpm's symlink structure
 */
class PnpmWorkspaceResolverPlugin {
  constructor(options = {}) {
    this.options = {
      workspaceRoot: options.workspaceRoot || path.resolve(__dirname, "../../.."),
      verbose: options.verbose || false,
      ...options,
    };

    // Cache for resolved modules
    this.resolveCache = new Map();

    // Initialize workspace package mapping
    this.workspacePackages = new Map();
    this.initializeWorkspaceMapping();
  }

  /**
   * Initialize mapping of workspace packages
   */
  initializeWorkspaceMapping() {
    try {
      const pnpmWorkspaceFile = path.join(this.options.workspaceRoot, "pnpm-workspace.yaml");
      const packageJsonFile = path.join(this.options.workspaceRoot, "package.json");

      // Read workspace configuration
      let workspacePaths = [];

      if (fs.existsSync(pnpmWorkspaceFile)) {
        const yaml = require("js-yaml");
        const workspaceConfig = yaml.load(fs.readFileSync(pnpmWorkspaceFile, "utf8"));
        workspacePaths = workspaceConfig.packages || [];
      } else if (fs.existsSync(packageJsonFile)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
        workspacePaths = packageJson.workspaces || [];
      }

      // Scan for workspace packages
      this.scanWorkspacePackages(workspacePaths);

      /* if (this.options.verbose) {
        console.log(
          `[PnpmWorkspaceResolver] Found ${this.workspacePackages.size} workspace packages`,
        );
      } */
    } catch (error) {
      console.warn(
        "[PnpmWorkspaceResolver] Failed to initialize workspace mapping:",
        error.message,
      );
    }
  }

  /**
   * Scan workspace directories for packages
   */
  scanWorkspacePackages(workspacePaths) {
    const glob = require("glob");

    workspacePaths.forEach(pattern => {
      const fullPattern = path.join(this.options.workspaceRoot, pattern, "package.json");
      const packageFiles = glob.sync(fullPattern);

      packageFiles.forEach(packageFile => {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
          if (packageJson.name) {
            const packageDir = path.dirname(packageFile);
            this.workspacePackages.set(packageJson.name, packageDir);

            /* if (this.options.verbose) {
              console.log(`[PnpmWorkspaceResolver] Mapped ${packageJson.name} -> ${packageDir}`);
            } */
          }
        } catch (error) {
          console.warn(`[PnpmWorkspaceResolver] Failed to read ${packageFile}:`, error.message);
        }
      });
    });
  }

  /**
   * Resolve workspace package path
   */
  resolveWorkspacePackage(request) {
    // Check if it's a workspace package
    if (this.workspacePackages.has(request)) {
      return this.workspacePackages.get(request);
    }

    // Check for scoped packages or sub-paths
    const parts = request.split("/");
    if (parts.length > 1) {
      const packageName = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
      if (this.workspacePackages.has(packageName)) {
        const packageDir = this.workspacePackages.get(packageName);
        const subPath = parts.slice(parts[0].startsWith("@") ? 2 : 1).join("/");
        return path.join(packageDir, subPath);
      }
    }

    return null;
  }

  /**
   * Apply the plugin to the Rspack compiler
   */
  apply(compiler) {
    const pluginName = "PnpmWorkspaceResolverPlugin";

    // Use a simpler approach with resolver hooks

    compiler.hooks.normalModuleFactory.tap("PLUGIN", normalModuleFactory => {
      normalModuleFactory.hooks.beforeResolve.tap("PLUGIN", data => {
        if (data.request.includes("@ledgerhq/ui-shared")) {
          /* console.log("BEFORE RESOLVE");
          console.log(data); */
          //data.context =
          //  "/Users/kevin.le-seigle/WS/ledger-live/node_modules/.pnpm/@ledgerhq/ui-shared";
        }

        return;
      });
      normalModuleFactory.hooks.resolve.tap("PLUGIN", data => {
        /* if (data.request.includes("@ledgerhq/ui-shared")) {
          console.log("RESOLVE");
          console.log(data);
        } */

        return;
      });

      normalModuleFactory.hooks.afterResolve.tap("PLUGIN", data => {
        /* if (data.request.includes("@ledgerhq/ui-shared")) {
          console.log("AFTER RESOLVE");
          console.log(data);
        } */

        return;
      });
    });
    /* compiler.hooks.afterResolvers.tap(pluginName, compiler => {
      compiler.resolverFactory.hooks.resolver.for("normal").tap(pluginName, resolver => {
        resolver.hooks.resolve.tapAsync(pluginName, (request, resolveContext, callback) => {
          console.log("resolving request", request);
          if (!request.request || !request.request.includes("@ledgerhq")) {
            return callback();
          }
          console.log("resolving request", request);
          const moduleName = request.request;

          // Check cache first
          if (this.resolveCache.has(moduleName)) {
            const cached = this.resolveCache.get(moduleName);
            if (cached) {
              return callback(null, {
                ...request,
                path: cached,
                request: undefined,
              });
            }
            return callback();
          }

          // Try to resolve as workspace package
          console.log("resolving workspace package", moduleName);
          const workspaceResolution = this.resolveWorkspacePackage(moduleName);
          if (workspaceResolution && fs.existsSync(workspaceResolution)) {
            this.resolveCache.set(moduleName, workspaceResolution);

            if (this.options.verbose) {
              console.log(
                `[PnpmWorkspaceResolver] Resolved ${moduleName} -> ${workspaceResolution}`,
              );
            }

            return callback(null, {
              ...request,
              path: workspaceResolution,
              request: undefined,
            });
          }

          // Cache negative result
          this.resolveCache.set(moduleName, null);
          callback();
        });
      });
    });*/
  }
}

module.exports = PnpmWorkspaceResolverPlugin;

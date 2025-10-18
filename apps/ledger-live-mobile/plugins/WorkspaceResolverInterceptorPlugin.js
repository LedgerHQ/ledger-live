/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

/**
 * Custom Rspack plugin to intercept and validate pnpm workspace module resolution
 * This plugin provides comprehensive logging and validation for workspace directive resolution
 */
class WorkspaceResolverInterceptorPlugin {
  constructor(options = {}) {
    this.options = {
      workspaceRoot: options.workspaceRoot || path.resolve(__dirname, "../../.."),
      verbose: options.verbose || false,
      validateResolution: options.validateResolution !== false, // default true
      logWorkspaceRequests: options.logWorkspaceRequests !== false, // default true
      fixInvalidResolutions: options.fixInvalidResolutions !== false, // default true
      workspacePatterns: options.workspacePatterns || ["@ledgerhq/*", "workspace:*"],
      onResolutionSuccess: options.onResolutionSuccess || null,
      onResolutionFailure: options.onResolutionFailure || null,
      onResolutionFixed: options.onResolutionFixed || null,
      ...options,
    };

    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      workspaceRequests: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      fixedResolutions: 0,
      unfixableResolutions: 0,
      resolvedPackages: new Set(),
      unresolvedPackages: new Set(),
      fixedPackages: new Set(),
    };

    // Load workspace configuration
    this.workspaceConfig = this.loadWorkspaceConfig();
    this.workspacePackages = new Map();
    this.initializeWorkspaceMapping();
  }

  /**
   * Load workspace configuration from pnpm-workspace.yaml or package.json
   */
  loadWorkspaceConfig() {
    try {
      const pnpmWorkspaceFile = path.join(this.options.workspaceRoot, "pnpm-workspace.yaml");
      const packageJsonFile = path.join(this.options.workspaceRoot, "package.json");

      if (fs.existsSync(pnpmWorkspaceFile)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const yaml = require("js-yaml");
        return yaml.load(fs.readFileSync(pnpmWorkspaceFile, "utf8"));
      } else if (fs.existsSync(packageJsonFile)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
        return { packages: packageJson.workspaces || [] };
      }
    } catch (error) {
      console.warn("[WorkspaceInterceptor] Failed to load workspace config:", error.message);
    }
    return { packages: [] };
  }

  /**
   * Initialize mapping of workspace packages
   */
  initializeWorkspaceMapping() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const glob = require("glob");
      const workspacePaths = this.workspaceConfig.packages || [];

      workspacePaths.forEach(pattern => {
        const fullPattern = path.join(this.options.workspaceRoot, pattern, "package.json");
        const packageFiles = glob.sync(fullPattern);

        packageFiles.forEach(packageFile => {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
            if (packageJson.name) {
              const packageDir = path.dirname(packageFile);
              this.workspacePackages.set(packageJson.name, {
                path: packageDir,
                version: packageJson.version,
                main: packageJson.main,
                exports: packageJson.exports,
              });
            }
          } catch (error) {
            console.warn(`[WorkspaceInterceptor] Failed to read ${packageFile}:`, error.message);
          }
        });
      });

      if (this.options.verbose) {
        console.log(
          `[WorkspaceInterceptor] Initialized with ${this.workspacePackages.size} workspace packages:`,
          Array.from(this.workspacePackages.keys()),
        );
      }
    } catch (error) {
      console.warn("[WorkspaceInterceptor] Failed to initialize workspace mapping:", error.message);
    }
  }

  /**
   * Check if a request is a workspace directive
   */
  isWorkspaceRequest(request) {
    if (!request) return false;

    return this.options.workspacePatterns.some(pattern => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(request);
      }
      return request.includes(pattern);
    });
  }

  /**
   * Validate if a workspace package is resolved correctly
   */
  validateWorkspaceResolution(request, resolvedPath) {
    if (!this.isWorkspaceRequest(request))
      return { valid: true, reason: "Not a workspace request" };

    // Extract package name from request
    const packageName = this.extractPackageName(request);
    const workspaceInfo = this.workspacePackages.get(packageName);

    if (!workspaceInfo) {
      return {
        valid: false,
        reason: `Package '${packageName}' not found in workspace`,
        suggestion: `Available packages: ${Array.from(this.workspacePackages.keys()).join(", ")}`,
      };
    }

    if (!resolvedPath) {
      return {
        valid: false,
        reason: `Package '${packageName}' resolved to null/undefined`,
        workspaceInfo,
      };
    }

    // Check if resolved path is within workspace
    const workspacePath = workspaceInfo.path;
    const normalizedResolvedPath = path.resolve(resolvedPath);
    const normalizedWorkspacePath = path.resolve(workspacePath);

    if (!normalizedResolvedPath.startsWith(normalizedWorkspacePath)) {
      return {
        valid: false,
        reason: `Resolved path '${normalizedResolvedPath}' is not within workspace path '${normalizedWorkspacePath}'`,
        workspaceInfo,
      };
    }

    // Check if resolved file exists
    if (!fs.existsSync(normalizedResolvedPath)) {
      return {
        valid: false,
        reason: `Resolved file does not exist: ${normalizedResolvedPath}`,
        workspaceInfo,
      };
    }

    return {
      valid: true,
      reason: "Successfully resolved to workspace package",
      workspaceInfo,
      resolvedPath: normalizedResolvedPath,
    };
  }

  /**
   * Extract package name from request (handles scoped packages and sub-paths)
   */
  extractPackageName(request) {
    const parts = request.split("/");
    if (parts[0].startsWith("@")) {
      // Scoped package: @scope/package
      return parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0];
    }
    // Regular package: package
    return parts[0];
  }

  /**
   * Attempt to fix an invalid workspace resolution
   */
  attemptResolutionFix(request, currentResolvedPath) {
    if (!this.isWorkspaceRequest(request)) {
      return { success: false, reason: "Not a workspace request" };
    }

    const packageName = this.extractPackageName(request);
    const workspaceInfo = this.workspacePackages.get(packageName);

    if (!workspaceInfo) {
      return {
        success: false,
        reason: `Package '${packageName}' not found in workspace`,
        suggestion: `Available packages: ${Array.from(this.workspacePackages.keys()).join(", ")}`,
      };
    }

    // Calculate the sub-path within the package
    const parts = request.split("/");
    let subPath = "";

    if (parts[0].startsWith("@")) {
      // Scoped package: @scope/package/subpath
      subPath = parts.slice(2).join("/");
    } else {
      // Regular package: package/subpath
      subPath = parts.slice(1).join("/");
    }

    // Try different resolution strategies
    const candidates = [];

    // Strategy 1: Direct path to package entry point
    if (!subPath) {
      if (workspaceInfo.main) {
        candidates.push(path.resolve(workspaceInfo.path, workspaceInfo.main));
      }
      candidates.push(path.resolve(workspaceInfo.path, "index.js"));
      candidates.push(path.resolve(workspaceInfo.path, "index.ts"));
      candidates.push(path.resolve(workspaceInfo.path, "lib/index.js"));
      candidates.push(path.resolve(workspaceInfo.path, "src/index.js"));
      candidates.push(path.resolve(workspaceInfo.path, "src/index.ts"));
    } else {
      // Strategy 2: Sub-path within package
      candidates.push(path.resolve(workspaceInfo.path, subPath));
      candidates.push(path.resolve(workspaceInfo.path, subPath + ".js"));
      candidates.push(path.resolve(workspaceInfo.path, subPath + ".ts"));
      candidates.push(path.resolve(workspaceInfo.path, subPath + "/index.js"));
      candidates.push(path.resolve(workspaceInfo.path, subPath + "/index.ts"));
      candidates.push(path.resolve(workspaceInfo.path, "lib", subPath));
      candidates.push(path.resolve(workspaceInfo.path, "lib", subPath + ".js"));
      candidates.push(path.resolve(workspaceInfo.path, "src", subPath));
      candidates.push(path.resolve(workspaceInfo.path, "src", subPath + ".js"));
      candidates.push(path.resolve(workspaceInfo.path, "src", subPath + ".ts"));
    }

    // Find the first existing candidate
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          success: true,
          resolvedPath: candidate,
          reason: `Fixed resolution using strategy: ${candidate}`,
          workspaceInfo,
          originalPath: currentResolvedPath,
        };
      }
    }

    return {
      success: false,
      reason: `No valid resolution found for '${request}'`,
      suggestion: `Tried paths: ${candidates.join(", ")}`,
      workspaceInfo,
      candidates,
    };
  }

  /**
   * Log resolution details
   */
  logResolution(type, data) {
    if (!this.options.verbose && !this.options.logWorkspaceRequests) return;

    const timestamp = new Date().toISOString();
    const prefix = `[WorkspaceInterceptor/${type}]`;

    console.log(`${prefix} ${timestamp}`);
    console.log(`  Request: ${data.request || "N/A"}`);

    if (data.context) console.log(`  Context: ${data.context}`);
    if (data.issuer) console.log(`  Issuer: ${data.issuer}`);
    if (data.resolvedPath) console.log(`  Resolved: ${data.resolvedPath}`);
    if (data.validation) {
      console.log(`  Validation: ${data.validation.valid ? "✅ VALID" : "❌ INVALID"}`);
      console.log(`  Reason: ${data.validation.reason}`);
      if (data.validation.suggestion) {
        console.log(`  Suggestion: ${data.validation.suggestion}`);
      }
    }
    if (data.stats) {
      console.log(`  Stats: ${JSON.stringify(data.stats)}`);
    }
    console.log("");
  }

  /**
   * Generate resolution statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.workspaceRequests > 0
          ? ((this.stats.successfulResolutions / this.stats.workspaceRequests) * 100).toFixed(2) +
            "%"
          : "0%",
      fixRate:
        this.stats.workspaceRequests > 0
          ? ((this.stats.fixedResolutions / this.stats.workspaceRequests) * 100).toFixed(2) + "%"
          : "0%",
      resolvedPackagesList: Array.from(this.stats.resolvedPackages),
      unresolvedPackagesList: Array.from(this.stats.unresolvedPackages),
      fixedPackagesList: Array.from(this.stats.fixedPackages),
    };
  }

  /**
   * Apply the plugin to the Rspack compiler
   */
  apply(compiler) {
    const pluginName = "WorkspaceResolverInterceptorPlugin";

    // Hook into NormalModuleFactory for regular module resolution
    compiler.hooks.normalModuleFactory.tap(pluginName, normalModuleFactory => {
      // Before resolution - intercept early
      normalModuleFactory.hooks.beforeResolve.tap(pluginName, resolveData => {
        this.stats.totalRequests++;

        if (!resolveData || !resolveData.request) return;

        const isWorkspace = this.isWorkspaceRequest(resolveData.request);

        if (isWorkspace) {
          this.stats.workspaceRequests++;

          this.logResolution("BEFORE_RESOLVE", {
            request: resolveData.request,
            context: resolveData.context,
            issuer: resolveData.contextInfo?.issuer,
            stats: { workspaceRequests: this.stats.workspaceRequests },
          });
        }

        return; // Don't prevent resolution, just log
      });

      // After resolution - validate and potentially fix result
      normalModuleFactory.hooks.afterResolve.tap(pluginName, resolveData => {
        if (!resolveData || !resolveData.request) return;

        const isWorkspace = this.isWorkspaceRequest(resolveData.request);

        if (isWorkspace && this.options.validateResolution) {
          const resolvedPath = resolveData.createData?.resource || resolveData.resource;
          const validation = this.validateWorkspaceResolution(resolveData.request, resolvedPath);

          let fixAttempt = null;
          let finalValidation = validation;

          // Attempt to fix invalid resolutions
          if (!validation.valid && this.options.fixInvalidResolutions) {
            fixAttempt = this.attemptResolutionFix(resolveData.request, resolvedPath);

            if (fixAttempt.success) {
              // Apply the fix by modifying the resolve data
              if (resolveData.createData) {
                resolveData.createData.resource = fixAttempt.resolvedPath;
                resolveData.createData.userRequest = resolveData.request;
                resolveData.createData.request = resolveData.request;
              }

              // Re-validate after the fix
              finalValidation = this.validateWorkspaceResolution(
                resolveData.request,
                fixAttempt.resolvedPath,
              );

              // Update statistics for successful fix
              this.stats.fixedResolutions++;
              this.stats.fixedPackages.add(this.extractPackageName(resolveData.request));

              this.logResolution("RESOLUTION_FIXED", {
                request: resolveData.request,
                context: resolveData.context,
                issuer: resolveData.contextInfo?.issuer,
                originalPath: resolvedPath,
                fixedPath: fixAttempt.resolvedPath,
                fixReason: fixAttempt.reason,
                validation: finalValidation,
                stats: this.getStats(),
              });

              // Call custom callback for fixed resolution
              if (this.options.onResolutionFixed) {
                this.options.onResolutionFixed(resolveData, fixAttempt, finalValidation);
              }
            } else {
              // Fix attempt failed
              this.stats.unfixableResolutions++;

              this.logResolution("RESOLUTION_UNFIXABLE", {
                request: resolveData.request,
                context: resolveData.context,
                issuer: resolveData.contextInfo?.issuer,
                resolvedPath,
                fixAttempt,
                validation,
                stats: this.getStats(),
              });
            }
          }

          // Update statistics based on final validation
          if (finalValidation.valid) {
            this.stats.successfulResolutions++;
            this.stats.resolvedPackages.add(this.extractPackageName(resolveData.request));
          } else {
            this.stats.failedResolutions++;
            this.stats.unresolvedPackages.add(this.extractPackageName(resolveData.request));
          }

          // Log final resolution state (only if not already logged as fixed/unfixable)
          if (!fixAttempt) {
            this.logResolution("AFTER_RESOLVE", {
              request: resolveData.request,
              context: resolveData.context,
              issuer: resolveData.contextInfo?.issuer,
              resolvedPath,
              validation: finalValidation,
              stats: this.getStats(),
            });
          }

          // Call custom callbacks if provided
          if (finalValidation.valid && this.options.onResolutionSuccess) {
            this.options.onResolutionSuccess(resolveData, finalValidation);
          } else if (!finalValidation.valid && this.options.onResolutionFailure) {
            this.options.onResolutionFailure(resolveData, finalValidation);
          }
        }

        return; // Resolution data may have been modified above
      });

      // Hook into resolve stage for additional monitoring
      normalModuleFactory.hooks.resolve.tap(pluginName, resolveData => {
        if (!resolveData || !resolveData.request) return;

        if (this.isWorkspaceRequest(resolveData.request)) {
          this.logResolution("RESOLVE", {
            request: resolveData.request,
            context: resolveData.context,
            issuer: resolveData.contextInfo?.issuer,
          });
        }

        return; // Don't prevent resolution
      });
    });

    // Hook into ContextModuleFactory for require.context scenarios
    compiler.hooks.contextModuleFactory.tap(pluginName, contextModuleFactory => {
      contextModuleFactory.hooks.beforeResolve.tap(pluginName, resolveData => {
        if (resolveData && resolveData.request && this.isWorkspaceRequest(resolveData.request)) {
          this.logResolution("CONTEXT_BEFORE_RESOLVE", {
            request: resolveData.request,
            context: resolveData.context,
          });
        }
        return;
      });

      contextModuleFactory.hooks.afterResolve.tap(pluginName, resolveData => {
        if (resolveData && resolveData.request && this.isWorkspaceRequest(resolveData.request)) {
          this.logResolution("CONTEXT_AFTER_RESOLVE", {
            request: resolveData.request,
            context: resolveData.context,
            resolvedPath: resolveData.resource,
          });
        }
        return;
      });
    });

    // Add compilation hooks for final statistics
    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.finishModules.tap(pluginName, () => {
        if (this.options.verbose && this.stats.workspaceRequests > 0) {
          console.log("\n[WorkspaceInterceptor] Final Statistics:");
          console.log(JSON.stringify(this.getStats(), null, 2));
        }
      });
    });
  }
}

module.exports = WorkspaceResolverInterceptorPlugin;

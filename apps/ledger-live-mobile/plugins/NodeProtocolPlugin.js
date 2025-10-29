/**
 * NodeProtocolPlugin
 * 
 * A custom Rspack plugin to handle Node.js `node:` protocol imports.
 * 
 * Problem:
 * - Modern Node.js packages use `node:` protocol (e.g., `import { Buffer } from "node:buffer"`)
 * - Rspack doesn't support this protocol natively
 * - Even transpilation doesn't help because resolution happens before transpilation
 * 
 * Solution:
 * - Intercept module resolution
 * - Rewrite `node:buffer` to `buffer`, `node:stream` to `stream`, etc.
 * - Let Rspack's normal polyfill/fallback system handle the rest
 * 
 * This approach is better than:
 * 1. Transpiling packages (doesn't work - resolution happens first)
 * 2. Manual aliases (too many to maintain, doesn't handle all cases)
 * 3. Forking/patching packages (unsustainable)
 */

const NODE_PROTOCOL_PREFIX = "node:";

class NodeProtocolPlugin {
  constructor(options = {}) {
    this.options = { verbose: false, ...options };
    this.rewrittenCount = 0;
    this.rewrittenModules = new Set();
  }

  apply(compiler) {
    const pluginName = "NodeProtocolPlugin";

    // Hook into the module factory to intercept module resolution
    compiler.hooks.normalModuleFactory.tap(
      pluginName,
      (normalModuleFactory) => {
        // beforeResolve: Intercept before Rspack tries to resolve the module
        normalModuleFactory.hooks.beforeResolve.tap(
          pluginName,
          (resolveData) => {
            // Skip if resolveData is not valid
            if (!resolveData || !resolveData.request) {
              return;
            }

            // Check if this is a node: protocol import
            if (resolveData.request.startsWith(NODE_PROTOCOL_PREFIX)) {
              const originalRequest = resolveData.request;
              
              // Remove the "node:" prefix
              const rewrittenRequest = originalRequest.substring(
                NODE_PROTOCOL_PREFIX.length
              );

              // Update the request
              resolveData.request = rewrittenRequest;
              
              // Track for logging
              this.rewrittenCount++;
              this.rewrittenModules.add(originalRequest);

              if (this.options.verbose) {
                console.log(
                  `[${pluginName}] Rewriting: ${originalRequest} → ${rewrittenRequest}`
                );
              }
            }

            // Don't return anything - just mutate resolveData
            return;
          }
        );
      }
    );

    // Log summary after compilation
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (this.options.verbose && this.rewrittenCount > 0) {
        console.log(
          `[${pluginName}] Summary: Transformed ${this.rewrittenCount} node: protocol imports`
        );
        // Optionally log all unique modules
        // console.log('Rewritten modules:', Array.from(this.rewrittenModules));
      }
      
      // Reset for next compilation
      this.rewrittenCount = 0;
      this.rewrittenModules.clear();
    });
  }
}

module.exports = NodeProtocolPlugin;


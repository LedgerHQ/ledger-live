const path = require("path");

/**
 * Plugin to fix React Native internal relative imports
 * React Native uses relative imports like '../Utilities/Platform' which fail
 * after transpilation because the module context changes
 */
class ReactNativeResolverPlugin {
  constructor(options = {}) {
    this.reactNativePath = options.reactNativePath;
  }

  apply(resolver) {
    const target = resolver.ensureHook("resolved");

    resolver
      .getHook("described-resolve")
      .tapAsync("ReactNativeResolverPlugin", (request, resolveContext, callback) => {
        // Only handle requests from react-native modules
        if (!request.context?.issuer?.includes("react-native")) {
          return callback();
        }

        // Only handle relative imports
        if (!request.request.startsWith(".")) {
          return callback();
        }

        // Get the issuer's directory
        const issuerDir = path.dirname(request.context.issuer);
        
        // Resolve the relative path
        const absolutePath = path.resolve(issuerDir, request.request);
        
        // Check if this resolves to a file that exists
        const obj = {
          ...request,
          path: issuerDir,
          request: absolutePath,
        };

        return resolver.doResolve(target, obj, null, resolveContext, callback);
      });
  }
}

module.exports = ReactNativeResolverPlugin;


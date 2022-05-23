const path = require("path");

module.exports = (mappings) => ({
  name: "Alias",
  setup(build) {
    Object.entries(mappings).forEach(([filter, mappings]) => {
      if (!Array.isArray(mappings)) {
        mappings = [mappings];
      }

      const resolveCallback = async function(args) {
        const errors = [];

        for (const mapping of mappings) {
          const mappedPathAbsolute = args.path.replace(filter, mapping);
          const relativeMappedPath = path
            .relative(args.resolveDir, mappedPathAbsolute)
            // Fixes windows paths
            .replace(new RegExp("\\\\+", "g"), "/");

          const mappedPath = relativeMappedPath.startsWith(".")
            ? relativeMappedPath
            : `./${relativeMappedPath}`;

          const result = await build.resolve(mappedPath, {
            resolveDir: args.resolveDir,
          });

          if (result.errors.length > 0) {
            errors.push(...result.errors);
            continue;
          }

          return result;
        }

        return { errors };
      };

      build.onResolve({ filter: new RegExp(`^${filter}$`) }, resolveCallback);
      build.onResolve({ filter: new RegExp(`^${filter}/.+`) }, resolveCallback);
    });
  },
});

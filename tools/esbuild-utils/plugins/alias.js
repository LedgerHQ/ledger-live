const path = require("path");

module.exports = (mappings) => ({
  name: "Alias",
  setup(build) {
    Object.entries(mappings).forEach(([filter, mappings]) => {
      if (!Array.isArray(mappings)) {
        mappings = [mappings];
      }

      const resolveCallback = async function(args) {
        if (args.resolveDir === "") {
          return; // Ignore unresolvable paths
        }

        const errors = [];

        for (const mapping of mappings) {
          const rawMappedPath = args.path.replace(filter, mapping);
          const relativeMappedPath = path
            .relative(args.resolveDir, rawMappedPath)
            // Fixes windows paths
            .replace(new RegExp("\\\\+", "g"), "/");

          const mappedPath = relativeMappedPath.startsWith(".")
            ? relativeMappedPath
            : `./${relativeMappedPath}`;

          let result = await build.resolve(mappedPath, {
            kind: "import-statement",
            resolveDir: args.resolveDir,
          });

          if (result.errors.length > 0) {
            errors.push(...result.errors);
            result = await build.resolve(rawMappedPath, {
              kind: "import-statement",
              resolveDir: args.resolveDir,
            });

            if (result.errors.length > 0) {
              errors.push(...result.errors);
              continue;
            }
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

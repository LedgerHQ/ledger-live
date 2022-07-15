const flowRemoveTypes = require("flow-remove-types");
const { readFile } = require("fs").promises;

// All credits to https://github.com/dalcib/esbuild-plugin-flow
module.exports = (regexp = /$^/, force) => {
  return {
    name: "flow",
    setup(build) {
      build.onLoad({ filter: regexp }, async (args) => {
        try {
          const source = await readFile(args.path, "utf8");
          let output = source;
          if (force) {
            output = flowRemoveTypes("// @flow\n" + source, { pretty: true });
          } else {
            if (
              source.slice(0, 8) === "// @flow" ||
              source.match(/^\/\*.*@flow.*\*\//s)
            ) {
              output = flowRemoveTypes(source, { pretty: true });
            }
          }
          const contents = output.toString().replace(/static\s+\+/g, "static ");
          return {
            contents,
            loader: "jsx",
          };
        } catch (error) {
          //ignore
        }
      });
    },
  };
};

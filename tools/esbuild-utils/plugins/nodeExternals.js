const path = require("path");
const filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/; // Must not start with "/" or "./" or "../"

module.exports = {
  name: "Node Externals Plugin",
  setup(build) {
    build.onResolve({ filter }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

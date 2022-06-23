const fs = require("fs");
const dotenv = require("dotenv");

module.exports = (path, options = {}) => {
  return {
    name: "Dotenv",
    setup(build) {
      try {
        const buf = fs.readFileSync(path);
        const define = {};
        const config = dotenv.parse(buf);

        Object.entries(config).forEach(([key, value]) => {
          define["process.env." + key] = JSON.stringify(value);
        });

        build.initialOptions.define = {
          ...build.initialOptions.define,
          ...define,
        };
      } catch (error) {
        // Ignore…
        // console.error(error);
      }
    },
  };
};

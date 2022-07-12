const fs = require("fs");
const dotenv = require("dotenv");

const buildDefine = (path) => {
  try {
    const buf = fs.readFileSync(path);
    const define = {};
    const config = dotenv.parse(buf);

    Object.entries(config).forEach(([key, value]) => {
      define["process.env." + key] = JSON.stringify(value);
    });

    return define;
  } catch (error) {
    // Ignore…
    // console.error(error);
  }
};

module.exports = (path, options = {}) => {
  return {
    name: "Dotenv",
    setup(build) {
      const define = buildDefine(path) || {};
      build.initialOptions.define = {
        ...build.initialOptions.define,
        ...buildDefine(path),
      };
    },
  };
};
module.exports.buildDefine = buildDefine;

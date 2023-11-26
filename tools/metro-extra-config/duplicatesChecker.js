const path = require("path");

function bold(str) {
  return "\033[1m" + str + "\033[0;0m";
}

module.exports = () => {
  const modulesMap = new Map();

  return ({ context, moduleName, resolution }) => {
    if (!resolution?.filePath || moduleName.startsWith(".") || path.isAbsolute("/")) {
      return;
    }
    const { originModulePath } = context;
    if (modulesMap.has(moduleName)) {
      const storedResolution = modulesMap.get(moduleName);
      if (storedResolution?.filePath !== resolution?.filePath) {
        console.log(
          "\n\033[1;33m[Duplicate Checker]\033[0;0m " +
            bold(moduleName) +
            "\n" +
            `Resolution: ${bold(resolution?.filePath)}\n` +
            `      From: ${context.originModulePath}\n` +
            `            -----------------------------------------\n` +
            `  Previous: ${bold(storedResolution?.filePath)}\n` +
            `      From: ${storedResolution?.originModulePath}\n`,
        );
      }
    } else {
      modulesMap.set(moduleName, {
        ...resolution,
        originModulePath: context.originModulePath,
      });
    }
  };
};

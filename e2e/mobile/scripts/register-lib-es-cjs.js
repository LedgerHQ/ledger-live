const fs = require("node:fs");
const Module = require("node:module");
const swc = require("@swc/core");

// live-common is ESM-only with extensionless `lib-es` imports, illegal under Node's
// native ESM loader. The jest main process (config/globalSetup/reporters) requires it
// outside jest's transform, so transpile `lib-es` to CJS on require. See LIVE-31760.
const originalJs = Module._extensions[".js"];
Module._extensions[".js"] = function (mod, filename) {
  if (filename.includes("/libs/") && filename.includes("/lib-es/")) {
    const source = fs.readFileSync(filename, "utf8");
    const { code } = swc.transformSync(source, {
      filename,
      jsc: { parser: { syntax: "ecmascript" }, target: "es2022" },
      module: { type: "commonjs" },
    });
    return mod._compile(code, filename);
  }
  return originalJs(mod, filename);
};

const fs = require("node:fs");
const Module = require("node:module");
const swc = require("@swc/core");

function compileToCjs(mod, filename, syntax) {
  const source = fs.readFileSync(filename, "utf8");
  const { code } = swc.transformSync(source, {
    filename,
    jsc: {
      parser:
        syntax === "typescript"
          ? {
              syntax: "typescript",
              tsx: filename.endsWith(".tsx"),
              decorators: true,
              dynamicImport: true,
            }
          : { syntax: "ecmascript" },
      target: "es2022",
      transform: { react: { runtime: "automatic" } },
    },
    module: { type: "commonjs" },
  });
  return mod._compile(code, filename);
}

// live-common is ESM-only with extensionless `lib-es` imports, illegal under Node's
// native ESM loader. The jest main process (config/globalSetup/reporters) requires it
// outside jest's transform, so transpile `lib-es` to CJS on require. See LIVE-31760.
const originalJs = Module._extensions[".js"];
Module._extensions[".js"] = function (mod, filename) {
  if (filename.includes("/libs/") && filename.includes("/lib-es/")) {
    return compileToCjs(mod, filename, "ecmascript");
  }
  return originalJs(mod, filename);
};

// @shared, @features and @domain are consumed as source (their `main` points at raw
// `.ts`) and are reached through those same main-process requires (via live-common's
// lib-es). Node cannot resolve their extensionless TS imports, so transpile their
// source to CJS on require too; registering the .ts/.tsx handlers also lets the CJS
// resolver try those extensions, which resolves the extensionless specifiers.
const SOURCE_PKG_DIRS = ["/shared/", "/features/", "/domain/"];
const isSourcePkg = filename =>
  !filename.includes("/node_modules/") &&
  filename.includes("/src/") &&
  SOURCE_PKG_DIRS.some(dir => filename.includes(dir));

for (const ext of [".ts", ".tsx"]) {
  const original = Module._extensions[ext];
  Module._extensions[ext] = function (mod, filename) {
    if (isSourcePkg(filename)) return compileToCjs(mod, filename, "typescript");
    if (original) return original(mod, filename);
    return compileToCjs(mod, filename, "typescript");
  };
}

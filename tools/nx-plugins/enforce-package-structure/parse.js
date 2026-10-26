"use strict";

// Since TypeScript 7 the parser runs in a native server: one per process, started on first parse.

const path = require("node:path");
const { API } = require("typescript/sync");
const { ScriptKind } = require("typescript/ast");

/** @type {API | undefined} */
let api;

/** @returns {API} */
function server() {
  if (!api) {
    const started = new API({ cwd: process.cwd() });
    process.once("exit", () => started.close());
    api = started;
  }
  return api;
}

/**
 * @param {string} file parses a `.tsx` or `.jsx` file with JSX, and the rest without
 * @param {string} source
 * @returns {import("typescript/ast").SourceFile}
 */
function parse(file, source) {
  const kind = /\.[jt]sx$/.test(file) ? ScriptKind.TSX : ScriptKind.TS;
  const retained = server().createSourceFile(file, source, { scriptKind: kind });
  // The tree is already copied to this process; the lease only keeps it alive in the server.
  retained.dispose();
  return retained.sourceFile;
}

/** @returns {string} the directory of the declaration files TypeScript ships */
function defaultLibDirectory() {
  const root = path.resolve("__default-lib__.ts");
  const snapshot = server().createSnapshot({
    fileSystem: { kind: "layer", files: { [root]: "" } },
    createPrograms: [{ rootFiles: [root], compilerOptions: { lib: ["es5"], types: [] } }],
  });
  try {
    const [project] = snapshot.getProjects();
    const es5 = snapshot
      .getProgram(project.id)
      ?.getSourceFileNames()
      .find(name => path.basename(name) === "lib.es5.d.ts");
    if (!es5) throw new Error("TypeScript loaded no lib.es5.d.ts");
    return path.dirname(es5);
  } finally {
    snapshot.dispose();
  }
}

module.exports = { defaultLibDirectory, parse };

"use strict";

const path = require("node:path");
const ts = require("typescript");

/**
 * @param {string} file parses a `.tsx` or `.jsx` file with JSX, and the rest without
 * @param {string} source
 * @returns {ts.SourceFile}
 */
function parse(file, source) {
  const kind = /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
}

/** @returns {string} the directory of the declaration files TypeScript ships */
function defaultLibDirectory() {
  return path.dirname(ts.getDefaultLibFilePath({}));
}

module.exports = { defaultLibDirectory, parse };

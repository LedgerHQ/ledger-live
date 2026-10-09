// DefinePlugin does not rewrite `process.cwd()`-style calls, so they get a module-local `process`.
const BINDING = "\nvar process = globalThis.__LLD_PROCESS__;\n";

// Each alternative matches a given prefix in exactly one way, so a failed match cannot backtrack exponentially.
const DIRECTIVE = /^(?:\s|\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/|\/\/[^\n]*\n)*(['"])use strict\1;?/;

module.exports = function processShimLoader(source) {
  const directive = DIRECTIVE.exec(source);
  if (!directive) return BINDING + source;
  const end = directive[0].length;
  return source.slice(0, end) + BINDING + source.slice(end);
};

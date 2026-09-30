// A module-local `process` for unguarded process.cwd()/nextTick() callers: DefinePlugin does
// not rewrite a member expression in callee position.
const BINDING = "\nvar process = globalThis.__LLD_PROCESS__;\n";

// `use strict` only takes effect as the first statement, so the binding goes after it.
const DIRECTIVE = /^\s*(['"])use strict\1;?/;

module.exports = function processShimLoader(source) {
  const directive = DIRECTIVE.exec(source);
  if (!directive) return BINDING + source;
  const end = directive[0].length;
  return source.slice(0, end) + BINDING + source.slice(end);
};

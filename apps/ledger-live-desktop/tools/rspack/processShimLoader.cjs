/**
 * Binds `process` to the renderer's stand-in, for the few dependencies that read it without
 * feature-detecting first.
 *
 * DefinePlugin covers `process.browser` but not `process.cwd()` or `process.nextTick(fn)`:
 * it does not substitute a member expression in *callee* position. A module-local `process`
 * shadows the free variable, which works in every position.
 *
 * Applied through a narrow `include` rather than a ProvidePlugin, so the ~20 correctly
 * guarded `typeof process` checks elsewhere keep taking their browser branch.
 */
const BINDING = "\nvar process = globalThis.__LLD_PROCESS__;\n";

// `use strict` only takes effect as the first statement, so the binding goes after it.
const DIRECTIVE = /^\s*(['"])use strict\1;?/;

module.exports = function processShimLoader(source) {
  const directive = DIRECTIVE.exec(source);
  if (!directive) return BINDING + source;
  const end = directive[0].length;
  return source.slice(0, end) + BINDING + source.slice(end);
};

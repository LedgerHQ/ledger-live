// The call shapes that take a module specifier as their first argument, shared by the import rules
// of this package so that they all see the same set of specifiers.

// `require()`, `import()` and the jest mocking helpers, which take the specifier as an argument
// rather than on a `source` property.
const CALLEE_NAMES = new Set(["require"]);
const JEST_METHODS = new Set(["mock", "unmock", "doMock", "requireActual", "requireMock"]);

/**
 * @param {{ callee?: { type: string, name?: string, object?: { type: string, name?: string }, property?: { type: string, name?: string } } }} node
 * @returns {boolean} whether the call takes a module specifier as its first argument
 */
export function isSpecifierCall(node) {
  const callee = node.callee;
  if (!callee) return false;
  if (callee.type === "Identifier") return CALLEE_NAMES.has(callee.name);
  return (
    callee.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "jest" &&
    callee.property?.type === "Identifier" &&
    JEST_METHODS.has(callee.property.name)
  );
}

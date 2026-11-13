// Rationale and reported shapes: support/lint/README.md#redux-slicesselectors-in-slice.

import fs from "node:fs";
import path from "node:path";

const SELECTORS_IN_SLICE_RULE =
  "A selector that reads one slice belongs in its createSlice `selectors` field, exported from `slice.selectors`. Cross-slice and generic selectors stay standalone. See the slice-selectors skill (.agents/skills/slice-selectors/SKILL.md)";

const SELECTOR_NAME = /^select[A-Z0-9_$]|Selector$/;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$|[/\\]__tests__[/\\]/;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const CREATE_SLICE = /\bcreateSlice\s*[(<]/;
// Block comments, and line comments not preceded by `:` so a URL in a string survives.
const COMMENT = /\/\*[\s\S]*?\*\/|(?<![:\\])\/\/.*$/gm;

// The directories holding a layer config of a preset that turns the rule on.
const LAYER_ROOT = /^(?:domain|shared|features\/flow|features\/platform)\//;

// A state parameter typed with one of these is a slice or root state, whatever its position.
const STATE_TYPE = /State$/;

// AST keys that hold no runtime code, or point back up the tree.
const SKIPPED_KEYS = new Set([
  "parent",
  "range",
  "loc",
  "start",
  "end",
  "typeAnnotation",
  "typeParameters",
  "typeArguments",
  "returnType",
  "decorators",
]);

// Wrappers that leave the value of the expression they wrap unchanged.
const TRANSPARENT = new Set([
  "TSNonNullExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "ParenthesizedExpression",
  "ChainExpression",
]);

/**
 * @param {string} name
 * @returns {boolean} whether `name` reads as a selector: `select*` or `*Selector`
 */
function isSelectorName(name) {
  return SELECTOR_NAME.test(name);
}

/**
 * @param {string} dir
 * @param {(file: string) => boolean} visit returns true to stop the walk
 * @returns {boolean} whether `visit` stopped the walk
 */
function walkFiles(dir, visit) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && walkFiles(full, visit)) return true;
    } else if (SOURCE_FILE.test(entry.name) && !TEST_FILE.test(full) && visit(full)) {
      return true;
    }
  }
  return false;
}

const packageRootCache = new Map();

/**
 * @param {string} dir
 * @returns {string | null} the nearest directory at or above `dir` holding a package.json
 */
function packageRoot(dir) {
  if (packageRootCache.has(dir)) return packageRootCache.get(dir);
  let root = null;
  if (fs.existsSync(path.join(dir, "package.json"))) root = dir;
  else {
    const parent = path.dirname(dir);
    if (parent !== dir) root = packageRoot(parent);
  }
  packageRootCache.set(dir, root);
  return root;
}

const ownsSliceCache = new Map();

/**
 * @param {string | undefined} filename
 * @returns {boolean} whether the package of `filename` declares a `createSlice` in its `src/`
 */
function packageOwnsSlice(filename) {
  if (typeof filename !== "string") return false;
  const root = packageRoot(path.dirname(filename));
  if (!root) return false;
  if (ownsSliceCache.has(root)) return ownsSliceCache.get(root);

  const owns = walkFiles(path.join(root, "src"), file => {
    try {
      return CREATE_SLICE.test(fs.readFileSync(file, "utf8").replace(COMMENT, ""));
    } catch {
      return false;
    }
  });
  ownsSliceCache.set(root, owns);
  return owns;
}

/**
 * @param {any} node
 * @returns {string | null} the name a callee is called by, `selectX` for `selectX()` or `a.selectX()`
 */
function calleeName(node) {
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression" && !node.computed && node.property?.type === "Identifier") {
    return node.property.name;
  }
  return null;
}

/**
 * @param {any} node
 * @returns {string | null} the full path a callee is called by, `a.b.selectX` for `a.b.selectX()`,
 *   or null when a receiver is not a plain name
 */
function calleePath(node) {
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression" && !node.computed && node.property?.type === "Identifier") {
    const receiver = calleePath(node.object);
    return receiver && `${receiver}.${node.property.name}`;
  }
  return null;
}

/**
 * Calls `visit` on each node under `node`, with its parent, skipping type annotations.
 *
 * @param {any} node
 * @param {(node: any, parent: any) => void} visit
 * @param {any} [parent]
 */
function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (SKIPPED_KEYS.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit, node);
    } else if (value && typeof value === "object") {
      walk(value, visit, node);
    }
  }
}

/**
 * How `name` is used in `body`: the root keys it is read through, the selectors it is the first
 * argument of, and whether any other use makes the shape unknown.
 *
 * @param {any} body
 * @param {string} name
 * @returns {{ keys: Set<string>, calls: Set<string>, other: boolean }}
 */
function usesOf(body, name) {
  const keys = new Set();
  const calls = new Set();
  let other = false;

  /** @type {Map<any, any>} */
  const parents = new Map();
  /** @type {any[]} */
  const references = [];

  walk(body, (node, parent) => {
    parents.set(node, parent);
    if (node.type !== "Identifier" || node.name !== name) return;
    // A property name or an object key is a label, not a reference.
    if (parent?.type === "MemberExpression" && parent.property === node && !parent.computed) return;
    if (parent?.type === "Property" && parent.key === node && !parent.computed && !parent.shorthand)
      return;
    references.push(node);
  });

  for (const reference of references) {
    let value = reference;
    let parent = parents.get(value);
    while (parent && TRANSPARENT.has(parent.type)) {
      value = parent;
      parent = parents.get(value);
    }

    if (parent?.type === "MemberExpression" && parent.object === value) {
      if (!parent.computed && parent.property?.type === "Identifier")
        keys.add(parent.property.name);
      else if (parent.computed && typeof parent.property?.value === "string")
        keys.add(parent.property.value);
      else other = true;
    } else if (parent?.type === "CallExpression" && parent.arguments?.[0] === value) {
      const callee = calleePath(parent.callee);
      if (callee && isSelectorName(calleeName(parent.callee) ?? "")) calls.add(callee);
      else other = true;
    } else {
      other = true;
    }
  }

  return { keys, calls, other };
}

/**
 * @param {any} param
 * @returns {any} the identifier or pattern a parameter binds, past a TS parameter property
 */
function bound(param) {
  return param?.type === "TSParameterProperty" ? param.parameter : param;
}

/**
 * @param {any} param
 * @param {any} body
 * @returns {boolean} whether a parameter after the first carries state: typed `*State`, or passed
 *   first to a selector
 */
function isStateParam(param, body) {
  let id = bound(param);
  if (id?.type === "AssignmentPattern") id = id.left;
  const annotation = id?.typeAnnotation?.typeAnnotation;
  if (
    annotation?.type === "TSTypeReference" &&
    STATE_TYPE.test(calleeName(annotation.typeName) ?? annotation.typeName?.right?.name ?? "")
  ) {
    return true;
  }
  return id?.type === "Identifier" && usesOf(body, id.name).calls.size > 0;
}

/**
 * @param {any} param
 * @param {string} name
 * @returns {boolean} whether the default value of `param` reads `name`
 */
function defaultReads(param, name) {
  const id = bound(param);
  if (id?.type !== "AssignmentPattern") return false;
  const { keys, calls, other } = usesOf(id.right, name);
  return other || keys.size > 0 || calls.size > 0;
}

/**
 * @param {any} property a Property of an ObjectPattern
 * @returns {boolean} whether its key is a fixed name: `a`, `"a"` or `["a"]`
 */
function hasStaticKey(property) {
  if (!property.computed) return true;
  return typeof property.key?.value === "string";
}

/**
 * Whether a function reads a single slice: its first parameter is read through exactly one root
 * key, or only passed to one selector, and no other parameter carries state.
 *
 * @param {{ params: any[], body: any }} fn
 * @returns {boolean}
 */
function readsOneSlice(fn) {
  const [first, ...rest] = fn.params ?? [];
  const id = bound(first);
  if (!id || !fn.body) return false;
  if (rest.some(param => isStateParam(param, fn.body))) return false;

  if (id.type === "ObjectPattern") {
    if (id.properties.some(property => property.type !== "Property")) return false;
    return id.properties.length === 1 && hasStaticKey(id.properties[0]);
  }
  if (id.type !== "Identifier") return false;
  if (rest.some(param => defaultReads(param, id.name))) return false;

  const { keys, calls, other } = usesOf(fn.body, id.name);
  if (other) return false;
  return (keys.size === 1 && calls.size === 0) || (keys.size === 0 && calls.size === 1);
}

/**
 * @param {any} node a CallExpression
 * @returns {any} the `selectors` value of a `createSlice({ ... })` call, or null
 */
function sliceSelectors(node) {
  if (calleeName(node.callee) !== "createSlice") return null;
  const options = node.arguments?.[0];
  if (options?.type !== "ObjectExpression") return null;
  const property = options.properties.find(
    p => p.type === "Property" && calleeName(p.key) === "selectors",
  );
  return property?.value ?? null;
}

/**
 * The slice-selectors convention covers domain/, shared/ and features/: `base` turns the rule on,
 * the shared and features presets keep it on, and the presets of the other layers turn it off.
 */
const selectorsInSlice = {
  /**
   * @param {{ filename?: string, report: (diagnostic: { message: string, node: any }) => void }} context
   */
  createOnce(context) {
    /** @type {[number, number][]} */
    let nested = [];

    /** @param {any} node */
    function isNested(node) {
      const [start, end] = node.range ?? [node.start, node.end];
      return nested.some(([from, to]) => start >= from && end <= to);
    }

    /**
     * @param {any} id the identifier that names the function
     * @param {any} fn the function
     */
    function check(id, fn) {
      if (id?.type !== "Identifier" || !isSelectorName(id.name)) return;
      if (fn.typeParameters) return;
      if (TEST_FILE.test(context.filename ?? "")) return;
      if (isNested(fn)) return;
      if (!readsOneSlice(fn)) return;
      if (!packageOwnsSlice(context.filename)) return;
      context.report({ message: SELECTORS_IN_SLICE_RULE, node: id });
    }

    return {
      before() {
        nested = [];
      },
      /** @param {any} node a CallExpression */
      CallExpression(node) {
        const selectors = sliceSelectors(node);
        if (selectors) nested.push(selectors.range ?? [selectors.start, selectors.end]);
      },
      /** @param {any} node a FunctionDeclaration */
      FunctionDeclaration(node) {
        check(node.id, node);
      },
      /** @param {any} node a VariableDeclarator */
      VariableDeclarator(node) {
        const init = node.init;
        if (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") {
          check(node.id, init);
        }
      },
    };
  },
};

/**
 * The override that waives the rule for `packages`, each a package directory relative to the repo
 * root, whose single-slice selectors are not nested yet. An entry goes in the change that nests
 * them, so the list only shrinks: a new package never joins it.
 *
 * oxlint matches `overrides[].files` against the path below the layer config that re-exports the
 * preset, so each glob drops the layer root: `domain/entity/contact` waives `entity/contact/src/**`.
 *
 * @param {string[]} packages
 * @returns {{ files: string[], rules: Record<string, "off"> }}
 */
function sliceSelectorsWaivers(packages) {
  return {
    files: packages.map(pkg => {
      const below = pkg.replace(LAYER_ROOT, "");
      if (below === pkg) throw new Error(`${pkg} is not a package of a slice-selectors layer`);
      return `${below}/src/**`;
    }),
    rules: { "redux-slices/selectors-in-slice": "off" },
  };
}

export { readsOneSlice, SELECTORS_IN_SLICE_RULE, sliceSelectorsWaivers };

export default {
  meta: {
    name: "redux-slices",
  },
  rules: {
    "selectors-in-slice": selectorsInSlice,
  },
};

const path = require("node:path");
const { originLookup } = require("./sourceMapOrigin.cjs");

// Fails the production renderer build on an unguarded `process.*` read or Node timer global.
// A text heuristic over the minified output, not a proof.

const COMPARE = String.raw`[!=]==?|[<>]`;
const LITERAL = String.raw`"[a-z]*"|'[a-z]*'`;
const NOTHING = String.raw`void 0|undefined|null`;
const END = String.raw`(?![\w$])`;

function guardFor(name, object) {
  const typeofCheck = String.raw`typeof ${name}\s*(?<o1>${COMPARE})\s*(?<l1>${LITERAL})|(?<l2>${LITERAL})\s*(?<o2>${COMPARE})\s*typeof ${name}`;
  const presence = String.raw`(?<neg>!*)\s*(?:(?<n1>${NOTHING})\s*(?<p1>[!=]==?)\s*|(?<other1>(?:${COMPARE})\s*))?(?:${object})\.${name}${END}(?:\s*(?<p2>[!=]==?)\s*(?<n2>${NOTHING})${END}|(?<other2>\s*(?:${COMPARE})))?`;
  return new RegExp(`${typeofCheck}|${presence}`, "g");
}

const GUARD = guardFor("process", String.raw`globalThis|[\w$]+\.g`);
const GUARD_WINDOW = 140;

function polarityOf({ o1, l1, o2, l2, neg, n1, n2, p1, p2, other1, other2 }) {
  const op = o1 ?? o2;
  if (op !== undefined) {
    const literal = (l1 ?? l2).slice(1, -1);
    if (op[0] === "=") return literal === "undefined" ? "absent" : "present";
    if (op[0] === "!") return literal === "undefined" ? "present" : "absent";
    if (literal !== "u") return null;
    return op === (o1 === undefined ? "<" : ">") ? "absent" : "present";
  }
  if (other1 !== undefined || other2 !== undefined) return null;
  const nothingOp = p1 ?? p2;
  const letsUndefinedThrough = nothingOp?.length === 3 && (n1 ?? n2) === "null";
  if (letsUndefinedThrough) return null;
  const equalsNothing = nothingOp?.[0] === "=";
  return (neg.length % 2 === 1) !== equalsNothing ? "absent" : "present";
}

function openerBefore(code, from) {
  let depth = 0;
  for (let i = from - 1; i >= Math.max(0, from - GUARD_WINDOW); i--) {
    if (code[i] === ")") depth++;
    else if (code[i] === "(") {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

function groupKind(code, opener) {
  const before = code.slice(Math.max(0, opener - 10), opener);
  if (/\b(?:if|while)\s*$/.test(before)) return "condition";
  if (
    /[\w$)\]]\s*$/.test(before) &&
    !/\b(?:return|typeof|void|case|throw|in|of|else|do)\s*$/.test(before)
  ) {
    return "call";
  }
  return "group";
}

const OPERATOR = /&&|\|\||(?<!\?)\?(?![.?])|:/y;

// true: the read runs only if the guard passed; false: only if it failed; null: either way.
function branchOf(ops) {
  const question = ops.indexOf("?");
  const chain = question === -1 ? ops : ops.slice(0, question);
  const leavesEnclosingTernary = chain.includes(":");
  if (leavesEnclosingTernary) return null;
  const andOnly = chain.every(op => op === "&&");
  const orFirst = chain[0] === "||";
  if (question === -1) {
    if (chain.length === 0) return null;
    if (andOnly) return true;
    return orFirst ? false : null;
  }
  let nested = 0;
  let alternate = false;
  for (const op of ops.slice(question + 1)) {
    if (op === "?") nested++;
    else if (op !== ":") continue;
    else if (nested > 0) nested--;
    else if (alternate) return null;
    else alternate = true;
  }
  if (!alternate) return andOnly ? true : null;
  return chain.length === 0 || orFirst ? false : null;
}

function readsGuardTrueBranch(code, guardStart, guardEnd, readIndex) {
  let depth = 0;
  let parens = 0;
  let groupStart = guardStart;
  let inBody = false;
  let afterElse = false;
  let nestedIf = false;
  let falseBranchKnown = true;
  let ops = [];
  for (let i = guardEnd; i < readIndex; i++) {
    const char = code[i];
    const rest = code.slice(i + 1, readIndex);
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth < 0) return null;
      const endsExpression = /^\s*[),&|?:.\]]/.test(rest);
      if (depth === 0 && !endsExpression) {
        if (!/^\s*else\b/.test(rest) || nestedIf) return null;
        afterElse = true;
      }
    } else if (depth > 0) continue;
    else if (char === "(") parens++;
    else if (char === ")") {
      if (parens > 0) {
        parens--;
        continue;
      }
      if (inBody || afterElse || ops.some(op => op !== "&&")) return null;
      if (ops.length > 0) falseBranchKnown = false;
      ops = [];
      groupStart = openerBefore(code, groupStart);
      if (groupStart === -1) return null;
      const kind = groupKind(code, groupStart);
      if (kind === "call") return null;
      inBody = kind === "condition";
    } else if (parens > 0) continue;
    else if (char === ";") {
      if (!/^\s*else\b/.test(rest) || nestedIf) return null;
      afterElse = true;
    } else if (inBody || afterElse) {
      const startsIf = /^if\b/.test(code.slice(i, i + 3)) && !/[\w$]/.test(code[i - 1]);
      if (!afterElse && startsIf) nestedIf = true;
    } else if (char === ",") return null;
    else {
      OPERATOR.lastIndex = i;
      const op = OPERATOR.exec(code)?.[0];
      if (op) {
        ops.push(op);
        i += op.length - 1;
      }
    }
  }
  const branch = inBody || afterElse ? !afterElse : branchOf(ops);
  return branch === false && !falseBranchKnown ? null : branch;
}

function isGuarded(code, index, guard) {
  const start = Math.max(0, index - GUARD_WINDOW);
  let last = null;
  for (const match of code.slice(start, index).matchAll(guard)) last = match;
  if (!last) return false;
  const polarity = polarityOf(last.groups);
  if (polarity === null) return false;
  const guardStart = start + last.index;
  const guardTrue = readsGuardTrueBranch(code, guardStart, guardStart + last[0].length, index);
  if (guardTrue === null) return false;
  return guardTrue === (polarity === "present");
}

const READ = /\bprocess(\?)?\.([A-Za-z_$][A-Za-z0-9_$]*)/g;

const GLOBALS = ["setImmediate", "clearImmediate"];

const GLOBAL_READS = GLOBALS.map(name => ({
  name,
  read: new RegExp(String.raw`(?<![.$\w])${name}\b`, "g"),
  guard: guardFor(name, "globalThis|window|self"),
}));

const DEFINE_HANDLED = new Set([
  "env",
  "platform",
  "mas",
  "windowsStore",
  "type",
  "release",
  "browser",
]);

// Reads verified not to throw, by `<file under node_modules> :: property`; more than `max` fails.
const ALLOWED = new Map(
  Object.entries({
    "@stellar/stellar-base/dist/stellar-base.min.js :: binding": {
      reason: "probed inside try/catch",
      max: 1,
    },
    "@stellar/stellar-base/dist/stellar-base.min.js :: chdir": {
      reason: "vendored process/browser, module-local",
      max: 1,
    },
    "icon-sdk-js/build/icon-sdk-js.web.min.js :: binding": {
      reason: "vendored process/browser, module-local",
      max: 1,
    },
    "icon-sdk-js/build/icon-sdk-js.web.min.js :: chdir": {
      reason: "vendored process/browser, module-local",
      max: 1,
    },
    "async/internal/setImmediate.js :: nextTick": {
      reason: "guarded by hasNextTick, computed via `typeof process` too far above",
      max: 1,
    },
    "async/internal/setImmediate.js :: setImmediate": {
      reason: "guarded by hasSetImmediate, computed via `typeof` too far above",
      max: 1,
    },
    "axios/lib/utils.js :: setImmediate": {
      reason: "guarded by setImmediateSupported, a `typeof` check earlier in a comma sequence",
      max: 1,
    },
    "axios/dist/browser/axios.cjs :: setImmediate": {
      reason: "same setImmediateSupported guard as axios/lib/utils.js",
      max: 1,
    },
    "performance-now/lib/performance-now.js :: uptime": {
      reason: "guarded: the `typeof process` branch loses to performance.now",
      max: 1,
    },
    "@taquito/http-utils/dist/taquito-http-utils.es6.js :: versions": {
      reason: "guarded by `typeof process !== undefined` plus ?.",
      max: 1,
    },
    "safer-buffer/safer.js :: binding": { reason: "probed inside try/catch", max: 1 },
    "process/browser.js :: binding": {
      reason: "module-local `process`, not a free variable",
      max: 1,
    },
    "process/browser.js :: chdir": {
      reason: "module-local `process`, not a free variable",
      max: 1,
    },
    "@multiversx/sdk-bls-wasm/bls_c.js :: argv": {
      reason: "Node-only branch, unreachable in the renderer",
      max: 3,
    },
    "msw/lib/browser/index.mjs :: stdout": { reason: "dev-only, behind ENABLE_MSW", max: 1 },
    "msw/lib/browser/index.mjs :: stderr": { reason: "dev-only, behind ENABLE_MSW", max: 2 },
    "@open-draft/logger/lib/index.mjs :: stdout": { reason: "dev-only, pulled in by MSW", max: 1 },
    "@open-draft/logger/lib/index.mjs :: stderr": { reason: "dev-only, pulled in by MSW", max: 2 },
    "@lottiefiles/dotlottie-react/dist/browser/index.js :: setImmediate": {
      reason: "RAF fallback class, built only when `typeof requestAnimationFrame != function`",
      max: 1,
    },
    "@lottiefiles/dotlottie-react/dist/browser/index.js :: clearImmediate": {
      reason: "same RAF fallback class as above",
      max: 1,
    },
    "scryptsy/lib/utils.js :: setImmediate": {
      reason:
        "only in the `.async` export; its one caller, @multiversx/sdk-core, uses the sync default",
      max: 2,
    },
  }),
);

function findUnguarded(code) {
  const hits = [];
  let match;
  READ.lastIndex = 0;
  while ((match = READ.exec(code))) {
    const [, optional, property] = match;
    const isMemberAccess = optional && code[match.index - 1] === ".";
    if (isMemberAccess) continue;
    if (DEFINE_HANDLED.has(property)) continue;
    if (isGuarded(code, match.index, GUARD)) continue;
    hits.push({ index: match.index, property });
  }
  return hits;
}

function prevNonSpace(code, from) {
  let i = from - 1;
  while (i >= 0 && (code[i] === " " || code[i] === "\n" || code[i] === "\t")) i--;
  return i;
}

function findUnguardedGlobals(code) {
  const hits = [];
  for (const { name, read, guard } of GLOBAL_READS) {
    read.lastIndex = 0;
    let match;
    while ((match = read.exec(code))) {
      const end = match.index + name.length;
      const prev = code[prevNonSpace(code, match.index)];
      const isObjectKey = (prev === "," || prev === "{") && code[end] === ":";
      if (isObjectKey) continue;
      if (/typeof\s*$/.test(code.slice(Math.max(0, match.index - 10), match.index))) continue;
      if (isGuarded(code, match.index, guard)) continue;
      hits.push({ index: match.index, property: name });
    }
  }
  return hits;
}

module.exports = class ProcessReadGuard {
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise("ProcessReadGuard", async compilation => {
      const outputPath = compilation.outputOptions.path;
      const fs = require("node:fs");
      const counts = new Map();

      for (const name of Object.keys(compilation.assets)) {
        if (!name.endsWith(".js")) continue;
        const file = path.join(outputPath, name);
        let code;
        try {
          code = fs.readFileSync(file, "utf8");
        } catch {
          continue;
        }
        const hits = [...findUnguarded(code), ...findUnguardedGlobals(code)];
        if (hits.length === 0) continue;

        let raw;
        try {
          raw = JSON.parse(fs.readFileSync(`${file}.map`, "utf8"));
        } catch {
          compilation.errors.push(
            new Error(
              `ProcessReadGuard needs a source map for ${name} and found none.\n\n` +
                "It resolves each read back to its origin package through the map, so without\n" +
                "one it cannot tell a vetted read from a new one. Register the plugin only when\n" +
                "`devtool` emits a source map — see rspack.renderer.ts.",
            ),
          );
          return;
        }
        const originAt = originLookup(code, raw);

        for (const hit of hits) {
          const key = `${originAt(hit.index) ?? name} :: ${hit.property}`;
          const entry = counts.get(key) ?? { count: 0, chunk: name };
          entry.count++;
          counts.set(key, entry);
        }
      }

      for (const [key, { max }] of ALLOWED) {
        const count = counts.get(key)?.count ?? 0;
        if (count < max) {
          compilation.warnings.push(
            new Error(
              `ProcessReadGuard: ALLOWED entry "${key}" allows ${max} hit(s), found ${count}; lower max or remove it.`,
            ),
          );
        }
      }

      const violations = [...counts].filter(
        ([key, { count }]) => count > (ALLOWED.get(key)?.max ?? 0),
      );
      if (violations.length === 0) return;

      const detail = violations
        .map(([key, { count, chunk }]) => {
          const max = ALLOWED.get(key)?.max ?? 0;
          return `  ${key}   ${count} hit(s), ${max} allowed (in ${chunk})`;
        })
        .sort()
        .join("\n");
      compilation.errors.push(
        new Error(
          "ProcessReadGuard: unguarded Node-only global(s) in the renderer bundle.\n\n" +
            `${detail}\n\n` +
            "The renderer is a sandboxed `web` target: it has no `process` and none of the\n" +
            "Node timer globals, so each of these throws a `ReferenceError` if that code\n" +
            "path ever runs.\n\n" +
            "Fix by adding the package to the processShimLoader rule in rspack.renderer.ts,\n" +
            "or — if you have confirmed the read cannot throw — to ALLOWED in\n" +
            "tools/rspack/processReadGuard.cjs with the reason and hit count.",
        ),
      );
    });
  }
};

module.exports.findUnguarded = findUnguarded;
module.exports.findUnguardedGlobals = findUnguardedGlobals;

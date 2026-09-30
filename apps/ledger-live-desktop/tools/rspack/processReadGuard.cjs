const path = require("path");

/**
 * Fails the production renderer build on an unguarded `process.*` read or bare Node global:
 * the sandboxed renderer has neither, so such a read throws only when its code path runs.
 */

// A read counts as guarded when one of these appears within GUARD_WINDOW characters before it.
const GUARD = /typeof process|globalThis\.process|\.g\.process|process\?\./;
const GUARD_WINDOW = 140;

const READ = /\bprocess\.([A-Za-z_$][A-Za-z0-9_$]*)/g;

// Free variables, so READ cannot see them.
const GLOBALS = ["setImmediate", "clearImmediate"];

const GLOBAL_READS = GLOBALS.map(name => ({
  name,
  // Skips property access (`utils.setImmediate`) and longer identifiers.
  read: new RegExp(String.raw`(?<![.$\w])${name}\b`, "g"),
  // The window includes the identifier, so `typeof setImmediate` guards itself.
  guard: new RegExp(String.raw`typeof ${name}|(?:globalThis|window|self)\.${name}`),
}));

// Rewritten by DefinePlugin: a surviving match is never a live reference.
const DEFINE_HANDLED = new Set([
  "env",
  "platform",
  "mas",
  "windowsStore",
  "type",
  "release",
  "browser",
]);

// Unguarded reads verified not to throw, keyed by `package :: property`.
const ALLOWED = new Map([
  ["@stellar/stellar-base :: binding", "probed inside try/catch"],
  ["@stellar/stellar-base :: chdir", "vendored process/browser, module-local"],
  ["icon-sdk-js :: binding", "vendored process/browser, module-local"],
  ["icon-sdk-js :: chdir", "vendored process/browser, module-local"],
  ["async :: nextTick", "guarded by hasNextTick, computed via `typeof process` too far above"],
  ["performance-now :: uptime", "guarded: the `typeof process` branch loses to performance.now"],
  ["@taquito/http-utils :: versions", "guarded by `typeof process !== undefined` plus ?."],
  ["safer-buffer :: binding", "probed inside try/catch"],
  ["buffer :: binding", "probed inside try/catch"],
  ["process :: binding", "module-local `process`, not a free variable"],
  ["process :: chdir", "module-local `process`, not a free variable"],
  ["@multiversx/sdk-bls-wasm :: argv", "Node-only branch, unreachable in the renderer"],
  ["assert :: emitWarning", "assertion-failure path only"],
  ["assert :: stderr", "assertion-failure path only"],
  ["msw :: stdout", "dev-only, behind ENABLE_MSW"],
  ["msw :: stderr", "dev-only, behind ENABLE_MSW"],
  ["@open-draft/logger :: stdout", "dev-only, pulled in by MSW"],
  ["@open-draft/logger :: stderr", "dev-only, pulled in by MSW"],

  [
    "@lottiefiles/dotlottie-react :: setImmediate",
    "RAF fallback class, built only when `typeof requestAnimationFrame != function`",
  ],
  ["@lottiefiles/dotlottie-react :: clearImmediate", "same RAF fallback class as above"],
  ["async :: setImmediate", "guarded by hasSetImmediate, computed via `typeof` too far above"],
  [
    "scryptsy :: setImmediate",
    "only in the `.async` export; its one caller, @multiversx/sdk-core, uses the sync default",
  ],
]);

const B64 = new Map(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]),
);

// Minimal base64-VLQ decoder: only the source index is needed, and no source-map library is
// reachable from this package.
function decodeMappings(mappings) {
  const perLine = [];
  let sourceIndex = 0;
  for (const lineText of mappings.split(";")) {
    const segments = [];
    let generatedColumn = 0;
    for (const segmentText of lineText.split(",")) {
      if (!segmentText) continue;
      const values = [];
      let shift = 0;
      let value = 0;
      for (const char of segmentText) {
        const digit = B64.get(char);
        if (digit === undefined) break;
        value += (digit & 31) << shift;
        if (digit & 32) {
          shift += 5;
          continue;
        }
        const negative = value & 1;
        value >>= 1;
        values.push(negative ? -value : value);
        shift = 0;
        value = 0;
      }
      if (values.length === 0) continue;
      generatedColumn += values[0];
      if (values.length >= 4) sourceIndex += values[1];
      segments.push([generatedColumn, sourceIndex]);
    }
    perLine.push(segments);
  }
  return perLine;
}

function sourceAt(decoded, sources, line, column) {
  const segments = decoded[line - 1];
  if (!segments || segments.length === 0) return null;
  let found = null;
  for (const [generatedColumn, sourceIndex] of segments) {
    if (generatedColumn > column) break;
    found = sourceIndex;
  }
  return found === null ? null : (sources[found] ?? null);
}

// Package name for a dependency; first-party sources keep their path so each is reported.
function packageOf(source) {
  const parts = source.split(/[\\/]node_modules[\\/]/);
  const tail = parts[parts.length - 1];
  if (!tail) return source;
  if (parts.length === 1) {
    return tail.replace(/^webpack:\/\/[^/]*\//, "").replace(/^(?:\.\.?\/)+/, "");
  }
  const segments = tail.split(/[\\/]/);
  return segments[0].startsWith("@") ? `${segments[0]}/${segments[1]}` : segments[0];
}

function findUnguarded(code) {
  const hits = [];
  let match;
  READ.lastIndex = 0;
  while ((match = READ.exec(code))) {
    if (DEFINE_HANDLED.has(match[1])) continue;
    const before = code.slice(Math.max(0, match.index - GUARD_WINDOW), match.index);
    if (GUARD.test(before)) continue;
    hits.push({ index: match.index, property: match[1] });
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
      // Object keys are not reads; a ternary branch (`? setImmediate :`) is.
      const prev = code[prevNonSpace(code, match.index)];
      if ((prev === "," || prev === "{") && code[end] === ":") continue;
      if (guard.test(code.slice(Math.max(0, match.index - GUARD_WINDOW), end))) continue;
      hits.push({ index: match.index, property: name });
    }
  }
  return hits;
}

module.exports = class ProcessReadGuard {
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise("ProcessReadGuard", async compilation => {
      const outputPath = compilation.outputOptions.path;
      const fs = require("fs");
      const violations = new Map();

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
        const decoded = decodeMappings(raw.mappings);
        const sources = raw.sources;

        const lineStarts = [];
        for (let i = 0, offset = 0; ; i++) {
          lineStarts.push(offset);
          const next = code.indexOf("\n", offset);
          if (next === -1) break;
          offset = next + 1;
        }

        for (const hit of hits) {
          let line = lineStarts.findIndex(start => start > hit.index);
          line = line === -1 ? lineStarts.length : line;
          const source = sourceAt(decoded, sources, line, hit.index - lineStarts[line - 1]);
          const origin = source ? packageOf(source) : name;
          const key = `${origin} :: ${hit.property}`;
          if (ALLOWED.has(key)) continue;
          if (!violations.has(key)) violations.set(key, name);
        }
      }

      if (violations.size === 0) return;

      const detail = [...violations]
        .map(([key, chunk]) => `  ${key}   (in ${chunk})`)
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
            "tools/rspack/processReadGuard.cjs with the reason.",
        ),
      );
    });
  }
};

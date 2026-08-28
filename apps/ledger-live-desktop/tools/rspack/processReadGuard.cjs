const path = require("path");

/**
 * Fails the production renderer build when a dependency reads `process` unguarded.
 *
 * A context-isolated renderer has no `process`, so such a read is a latent `ReferenceError`
 * that only surfaces when that code path runs — which is how `vfile`'s `process.cwd()`
 * reached production as a crash in the firmware-update release notes rather than as a build
 * failure. Guarded reads (`typeof process`) are fine and stay in the bundle.
 */

// A read counts as guarded when one of these appears within GUARD_WINDOW characters before it.
const GUARD = /typeof process|globalThis\.process|\.g\.process|process\?\./;
const GUARD_WINDOW = 140;

const READ = /\bprocess\.([A-Za-z_$][A-Za-z0-9_$]*)/g;

// Rewritten by DefinePlugin, so a surviving match is prose in a string literal or a module
// the shim loader already bound — never a live reference.
const DEFINE_HANDLED = new Set([
  "env",
  "platform",
  "mas",
  "windowsStore",
  "type",
  "release",
  "browser",
]);

/**
 * Unguarded reads checked by hand and known not to throw, keyed by `package :: property`.
 * Anything not listed fails the build: shim the module in `rspack.renderer.ts`, or add it
 * here with the reason once you have confirmed it cannot throw.
 */
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
]);

const B64 = new Map(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]),
);

/**
 * Minimal base64-VLQ reader for a source map's `mappings`. Only the source index is needed,
 * not the original line or name, so this stops short of a full implementation — and neither
 * `source-map` nor `@jridgewell/trace-mapping` is reachable from this package.
 */
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

/** `.../node_modules/@scope/name/...` or `.../node_modules/name/...` → `@scope/name`. */
function packageOf(source) {
  const parts = source.split(/[\\/]node_modules[\\/]/);
  const tail = parts[parts.length - 1];
  if (!tail) return source;
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
        const hits = findUnguarded(code);
        if (hits.length === 0) continue;

        // Only now is it worth paying for the source map.
        let decoded = null;
        let sources = null;
        try {
          const raw = JSON.parse(fs.readFileSync(`${file}.map`, "utf8"));
          decoded = decodeMappings(raw.mappings);
          sources = raw.sources;
        } catch {
          /* No map: report the chunk instead, which still points at the problem. */
        }

        const lineStarts = [];
        for (let i = 0, offset = 0; ; i++) {
          lineStarts.push(offset);
          const next = code.indexOf("\n", offset);
          if (next === -1) break;
          offset = next + 1;
        }

        for (const hit of hits) {
          let origin = name;
          if (decoded) {
            let line = lineStarts.findIndex(start => start > hit.index);
            line = line === -1 ? lineStarts.length : line;
            const source = sourceAt(decoded, sources, line, hit.index - lineStarts[line - 1]);
            if (source) origin = packageOf(source);
          }
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
          "ProcessReadGuard: unguarded `process` read(s) in the renderer bundle.\n\n" +
            `${detail}\n\n` +
            "A context-isolated renderer has no `process`, so each of these throws\n" +
            "`ReferenceError: process is not defined` if that code path ever runs.\n\n" +
            "Fix by adding the package to the processShimLoader rule in rspack.renderer.ts,\n" +
            "or — if you have confirmed the read cannot throw — to ALLOWED in\n" +
            "tools/rspack/processReadGuard.cjs with the reason.",
        ),
      );
    });
  }
};

const fs = require("node:fs");
const path = require("node:path");
const { originLookup } = require("./sourceMapOrigin.cjs");
const {
  BUILD_ENV_NAMES,
  FORWARDED,
  NOT_FORWARDED,
  WITHHELD,
} = require("../../src/main/rendererEnvKeys.cjs");

// Fails the renderer build on a `process.env` key that main neither forwards nor deliberately
// withholds: main copies only listed keys into the snapshot, so an unlisted flag would read as
// unset without any error. Blind to modules behind processShimLoader, whose local `process`
// the minifier renames.

const KNOWN = new Set([...BUILD_ENV_NAMES, ...FORWARDED, ...NOT_FORWARDED]);

// A string literal is how `getEnv("SEED")` survives minification.
const WITHHELD_KEY = `(${WITHHELD.join("|")})`;
const WITHHELD_MENTION = new RegExp(
  String.raw`(["'])${WITHHELD_KEY}\1|__LLD_PROCESS_ENV__\??\.${WITHHELD_KEY}(?![\w$])`,
  "g",
);

// DefinePlugin's rewrite of `process.env`, then an optional `.KEY`, `?.KEY` or `["KEY"]`.
const USE =
  /globalThis\.__LLD_PROCESS_ENV__(?![\w$])(?:\s*\??\.\s*([A-Za-z_$][\w$]*)|\s*(?:\?\.)?\[\s*(["'])([^"'\\]+)\2\s*\])?/g;

// Uses that name no key (computed reads, `in`, the whole object), by origin.
const OPAQUE = new Map(
  Object.entries({
    "src/config/windowConstants.ts": {
      reason: "intFromEnv reads LEDGER_MIN_WIDTH and LEDGER_MIN_HEIGHT, both FORWARDED",
      max: 1,
    },
    "src/renderer/experimental.tsx": {
      reason: "iterates and probes @shared/env names, which main always forwards",
      max: 3,
    },
    "@open-draft/logger/lib/index.mjs": {
      reason: "getVariable reads DEBUG and LOG_LEVEL, both NOT_FORWARDED",
      max: 1,
    },
    "msw/lib/browser/index.mjs": {
      reason: "inlined copy of @open-draft/logger's getVariable",
      max: 1,
    },
    "@segment/analytics-next/dist/pkg/lib/get-process-env.js": {
      reason: "returns the object for a NODE_ENV read, NOT_FORWARDED",
      max: 2,
    },
    "@firebase/util/dist/index.esm2017.js": {
      reason: "presence check before reading __FIREBASE_DEFAULTS__",
      max: 1,
    },
    "semver/internal/debug.js": {
      reason: "presence check before reading NODE_DEBUG",
      max: 1,
    },
    "styled-components/dist/styled-components.browser.cjs.js": {
      reason: "presence checks before reading the SC_* keys",
      max: 3,
    },
  }),
);

function findEnvUses(code) {
  const reads = [];
  const opaque = [];
  for (const match of code.matchAll(USE)) {
    const key = match[1] ?? match[3];
    if (key === undefined) opaque.push(match.index);
    else reads.push({ index: match.index, key });
  }
  return { reads, opaque };
}

function findWithheld(code) {
  return [...code.matchAll(WITHHELD_MENTION)].map(match => ({
    index: match.index,
    key: match[2] ?? match[3],
  }));
}

module.exports = class RendererEnvGuard {
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise("RendererEnvGuard", async compilation => {
      const outputPath = compilation.outputOptions.path;
      const unknown = new Map();
      const withheld = new Map();
      const opaqueCounts = new Map();

      for (const name of Object.keys(compilation.assets)) {
        if (!name.endsWith(".js")) continue;
        const file = path.join(outputPath, name);
        let code;
        try {
          code = fs.readFileSync(file, "utf8");
        } catch {
          continue;
        }
        const { reads, opaque } = findEnvUses(code);
        const unlisted = reads.filter(({ key }) => !KNOWN.has(key) && !WITHHELD.includes(key));
        const mentions = findWithheld(code);
        if (unlisted.length === 0 && opaque.length === 0 && mentions.length === 0) continue;

        let raw;
        try {
          raw = JSON.parse(fs.readFileSync(`${file}.map`, "utf8"));
        } catch {
          compilation.errors.push(
            new Error(
              `RendererEnvGuard needs a source map for ${name} and found none. Register the\n` +
                "plugin only when `devtool` emits a source map — see rspack.renderer.ts.",
            ),
          );
          return;
        }
        const originAt = originLookup(code, raw);

        for (const { index, key } of unlisted) {
          const origins = unknown.get(key) ?? new Set();
          origins.add(originAt(index) ?? name);
          unknown.set(key, origins);
        }
        for (const { index, key } of mentions) {
          const origins = withheld.get(key) ?? new Set();
          origins.add(originAt(index) ?? name);
          withheld.set(key, origins);
        }
        for (const index of opaque) {
          const origin = originAt(index) ?? name;
          opaqueCounts.set(origin, (opaqueCounts.get(origin) ?? 0) + 1);
        }
      }

      for (const [origin, { max }] of OPAQUE) {
        const count = opaqueCounts.get(origin) ?? 0;
        if (count < max) {
          compilation.warnings.push(
            new Error(
              `RendererEnvGuard: OPAQUE entry "${origin}" allows ${max} use(s), found ${count}; lower max or remove it.`,
            ),
          );
        }
      }

      const problems = [
        ...[...unknown].map(([key, origins]) => `  ${key}   read by ${[...origins].join(", ")}`),
        ...[...withheld].map(
          ([key, origins]) => `  ${key}   WITHHELD, but named by ${[...origins].join(", ")}`,
        ),
        ...[...opaqueCounts]
          .filter(([origin, count]) => count > (OPAQUE.get(origin)?.max ?? 0))
          .map(
            ([origin, count]) =>
              `  ${origin}   ${count} keyless use(s), ${OPAQUE.get(origin)?.max ?? 0} allowed`,
          ),
      ].sort();
      if (problems.length === 0) return;

      compilation.errors.push(
        new Error(
          "RendererEnvGuard: the renderer reads env keys main does not know about.\n\n" +
            `${problems.join("\n")}\n\n` +
            "Main copies only listed keys into the renderer's env, so an unlisted one is always\n" +
            "unset there. Add each key to FORWARDED or NOT_FORWARDED in\n" +
            "src/main/rendererEnvKeys.cjs. For a keyless use, list the keys it reads there and\n" +
            "add its origin to OPAQUE in tools/rspack/rendererEnvGuard.cjs. A WITHHELD key holds\n" +
            "a secret in E2E runs: keep the code that reads it out of the renderer.",
        ),
      );
    });
  }
};

module.exports.findEnvUses = findEnvUses;
module.exports.findWithheld = findWithheld;

"use strict";

// The `export *` graph of a package, resolved as the web, iOS and Android bundlers do: how deep
// each barrel sits below its entry, and which barrel breaks a pure chain to it (see chainBreak).

const fs = require("node:fs");
const path = require("node:path");
const { chainBreak, isBarrelFile, starReexportTargets } = require("./rules");
const { resolveRelative } = require("./components");

/** @typedef {import("./rules").ChainBreak} ChainBreak */
/** @typedef {import("./rules").ChainBreaker} ChainBreaker */

const NATIVE_EXTENSIONS = require("./components.config.json").extensions.native;
// Re.Pack builds iOS and Android apart, so a `.ios` file does not hide its `.android` sibling.
const RESOLUTIONS = [
  { platform: "web" },
  { platform: "native", extensions: NATIVE_EXTENSIONS.filter(ext => !ext.startsWith(".android.")) },
  { platform: "native", extensions: NATIVE_EXTENSIONS.filter(ext => !ext.startsWith(".ios.")) },
];

/**
 * The files a relative specifier loads, as the web, iOS and Android bundles resolve it.
 *
 * @param {string} fromFile absolute path of the importing file
 * @param {string} specifier relative specifier
 * @returns {string[]} absolute paths
 */
function resolveModule(fromFile, specifier) {
  const files = RESOLUTIONS.map(({ platform, extensions }) =>
    resolveRelative(fromFile, specifier, platform, extensions),
  );
  return [...new Set(files.filter(file => file !== null))];
}

/**
 * A barrel and its platform variants, which the bundlers treat as one module; any other file
 * alone.
 *
 * @param {string} file absolute path
 * @returns {string[]}
 */
function indexVariants(file) {
  if (!isBarrelFile(path.basename(file))) return [file];
  const directory = path.dirname(file);
  try {
    return fs
      .readdirSync(directory)
      .filter(isBarrelFile)
      .map(name => path.join(directory, name));
  } catch {
    return [file];
  }
}

/**
 * Each module of a package check, read, parsed and resolved once however many passes walk it.
 *
 * @returns {{ sourceOf: (file: string) => string | undefined, targetsOf: (file: string) => string[], breakOf: (file: string) => ChainBreak | undefined }}
 *   keyed by absolute path; targetsOf lists the modules a file's relative `export *` loads,
 *   platform variants of a barrel included
 */
function moduleGraph() {
  /** @type {Map<string, string | undefined>} */
  const sources = new Map();
  /** @type {Map<string, string[]>} */
  const targets = new Map();
  /** @type {Map<string, ChainBreak | undefined>} */
  const breaks = new Map();

  /**
   * @param {string} file
   * @returns {string | undefined}
   */
  function sourceOf(file) {
    if (!sources.has(file)) {
      try {
        sources.set(file, fs.readFileSync(file, "utf8"));
      } catch {
        sources.set(file, undefined);
      }
    }
    return sources.get(file);
  }

  /**
   * @param {string} file
   * @returns {string[]}
   */
  function targetsOf(file) {
    if (!targets.has(file)) {
      const source = sourceOf(file);
      const specifiers = source === undefined ? [] : starReexportTargets(source, file);
      targets.set(
        file,
        specifiers.flatMap(specifier => resolveModule(file, specifier).flatMap(indexVariants)),
      );
    }
    return targets.get(file);
  }

  /**
   * @param {string} file
   * @returns {ChainBreak | undefined}
   */
  function breakOf(file) {
    if (!breaks.has(file)) {
      const source = sourceOf(file);
      breaks.set(file, source === undefined ? undefined : chainBreak(source, file));
    }
    return breaks.get(file);
  }

  return { sourceOf, targetsOf, breakOf };
}

/**
 * How many barrels each file sits below its nearest entry. An entry is 0, so an entry reached
 * from another entry counts from itself; a barrel an entry reaches, directly or through plain
 * modules, is 1.
 *
 * @param {Set<string>} entries
 * @param {(file: string) => string[]} targetsOf
 * @param {(file: string) => boolean} isBarrel
 * @returns {Map<string, number>} for the files an entry reaches
 */
function barrelDepths(entries, targetsOf, isBarrel) {
  const depths = new Map([...entries].map(file => [file, 0]));
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift();
    for (const target of targetsOf(file)) {
      if (entries.has(target)) continue;
      const depth = depths.get(file) + (isBarrel(target) ? 1 : 0);
      if (depth >= (depths.get(target) ?? Infinity)) continue;
      depths.set(target, depth);
      queue.push(target);
    }
  }
  return depths;
}

/**
 * For each module below a breaker, a barrel that breaks the chain (see chainBreak), that breaker.
 * It taints every module it leads to, plain modules included, which pass it on; an entry breaks
 * nothing. A module is walked once clean and at most once more when tainted.
 *
 * @param {Set<string>} entries
 * @param {(file: string) => string[]} targetsOf
 * @param {(file: string) => boolean} breaks whether a file is a breaker
 * @returns {Map<string, string>} module to the breaker above it
 */
function chainBreakers(entries, targetsOf, breaks) {
  /** @type {Map<string, string>} */
  const tainted = new Map();
  const seen = new Set(entries);
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift();
    /** @type {string | undefined} */
    let passed;
    if (!entries.has(file)) passed = tainted.get(file) ?? (breaks(file) ? file : undefined);
    for (const target of targetsOf(file)) {
      if (entries.has(target)) continue;
      const taints = passed !== undefined && !tainted.has(target);
      if (taints) tainted.set(target, passed);
      if (!taints && seen.has(target)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return tainted;
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isBarrel(file) {
  return isBarrelFile(path.basename(file));
}

/**
 * How each file sits below its nearest entry, following relative `export *` the way the bundlers
 * resolve it: its depth (see barrelDepths) and, below the first level, its breaker: a barrel, the
 * entry excluded and itself included, that breaks a chain to it. Plain modules are transparent.
 *
 * @param {string[]} entries absolute paths
 * @param {ReturnType<typeof moduleGraph>} graph
 * @returns {Map<string, { depth: number, breaker?: ChainBreaker }>} absolute path to its place,
 *   for the files an entry reaches
 */
function barrelReach(entries, graph) {
  const entrySet = new Set(entries.flatMap(indexVariants));
  const depths = barrelDepths(entrySet, graph.targetsOf, isBarrel);
  const tainted = chainBreakers(
    entrySet,
    graph.targetsOf,
    file => isBarrel(file) && graph.breakOf(file) !== undefined,
  );
  /** @type {Map<string, { depth: number, breaker?: ChainBreaker }>} */
  const reach = new Map();
  for (const [file, depth] of depths) {
    /** @type {ChainBreaker | undefined} */
    let breaker;
    if (depth > 1 && isBarrel(file)) {
      const at = tainted.get(file) ?? file;
      const why = graph.breakOf(at);
      if (why !== undefined) breaker = { file: at, ...why };
    }
    reach.set(file, { depth, breaker });
  }
  return reach;
}

module.exports = { barrelDepths, barrelReach, chainBreakers, moduleGraph, resolveModule };

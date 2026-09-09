// Maps every e2e spec file to the team(s) that own it, so the `team` workflow input can be expanded
// into selectors the runners already understand — no new tag, no spec annotation, no stored
// registry.
//
// Ownership is READ FROM THE SOURCE: desktop specs set the `teamOwner` fixture option and mobile
// runners call `setTeamOwner()`, both through a `Team.<MEMBER>` reference. Coverage is 100% on
// both suites.
//
// CI-only (see ./README.md): never imported by the test runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SPEC_ANCHOR, escapeLiteral } from "./escaping.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");

// Closed vocabulary, mirroring libs/live-e2e-shared/src/enum/Team.ts. Duplicated here on purpose:
// the mobile determine-builds job sparse-checks-out e2e/tooling/filter but NOT libs/, so this file
// must not reach outside the checked-out tree.
export const TEAM_SLUGS = Object.freeze([
  "bst",
  "buy-and-sell",
  "coin-integration",
  "earn",
  "engagement",
  "swap",
  "wallet-xp",
]);

const TEAM_REFERENCE = /\bTeam\.([A-Z][A-Z0-9_]*)\b/g;
const IMPORT_SOURCE = /(?:from|import)\s*["']([^"']+)["']/g;

const IMPORT_ALIASES = [
  ["@e2e/", "e2e/mobile/"],
  ["tests/", "e2e/desktop/tests/"],
];

// Helpers that pick the owner at collection time from the currency. A spec that reaches one can
// belong to any team it returns, so it is attributed to ALL of them: a team filter must
// over-select a shared spec, never silently drop it.
// Keep in sync with libs/live-e2e-shared/src/data/delegateTeamOwner.ts.
const TEAM_OWNER_HELPERS = new Map([["delegateTeamOwner", ["BST", "COIN_INTEGRATION"]]]);

const MAX_IMPORT_DEPTH = 3;

// Team.WALLET_XP -> "wallet-xp". The enum's *values* ("Wallet XP", "BuyAndSell") are Allure
// display strings: inconsistent, and not safe to drop into a regex. The member name is the slug.
export function teamSlug(member) {
  return member.toLowerCase().replaceAll("_", "-");
}

const fileCache = new Map();

function readFileCached(filePath) {
  let text = fileCache.get(filePath);
  if (text === undefined) {
    text = fs.readFileSync(filePath, "utf8");
    fileCache.set(filePath, text);
  }
  return text;
}

function readTeamsIn(content) {
  const teams = new Set();
  for (const [, member] of content.matchAll(TEAM_REFERENCE)) teams.add(member);
  for (const [helper, members] of TEAM_OWNER_HELPERS) {
    if (content.includes(helper)) for (const member of members) teams.add(member);
  }
  return teams;
}

function resolveImport(fromFile, source) {
  let target;
  if (source.startsWith(".")) {
    target = path.resolve(path.dirname(fromFile), source);
  } else {
    const alias = IMPORT_ALIASES.find(([prefix]) => source.startsWith(prefix));
    if (!alias) return undefined;
    target = path.join(repoRoot, alias[1], source.slice(alias[0].length));
  }
  for (const candidate of [`${target}.ts`, path.join(target, "index.ts")]) {
    // A spec never owns another spec: only shared runners/helpers are followed.
    if (candidate.endsWith(".spec.ts")) continue;
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

// ADDITIVE, because ownership is per-TEST, not per-file: a spec can legitimately have several
// owners and the filter must over-select rather than silently drop.
// e2e/desktop/tests/specs/newSendFlow.tx.spec.ts is the case that proves it — only 11 of its 30
// entries carry `teamOwner: Team.BST`; the rest get `entry.teamOwner ?? Team.COIN_INTEGRATION`
// from the registrar (utils/newSendFlowUtils.ts), so Coin-integration really is their runtime
// owner and what Allure reports. Attributing the file to BST alone would hide those tests from
// `team=coin-integration` and turn a green run into missing coverage.
// The spec's own `Team.*` references seed the set; imports are then walked to pick up the
// fallbacks a shared registrar/runner supplies (which is also how mobile's thin shims get an
// owner at all). The walk stops at the first depth that contributes something new.
function teamsForSpec(specPath) {
  const content = readFileCached(specPath);
  const own = readTeamsIn(content);
  const found = new Set(own);
  const seen = new Set([specPath]);
  let level = [[specPath, content]];
  for (let depth = 0; depth < MAX_IMPORT_DEPTH && found.size === own.size; depth += 1) {
    const next = [];
    for (const [file, text] of level) {
      for (const [, source] of text.matchAll(IMPORT_SOURCE)) {
        const target = resolveImport(file, source);
        if (!target || seen.has(target)) continue;
        seen.add(target);
        let targetText;
        try {
          targetText = readFileCached(target);
        } catch {
          continue;
        }
        for (const member of readTeamsIn(targetText)) found.add(member);
        next.push([target, targetText]);
      }
    }
    level = next;
  }
  return found;
}

export function buildTeamIndex(files) {
  const index = new Map();
  for (const file of files) {
    for (const member of teamsForSpec(file)) {
      const slug = teamSlug(member);
      if (!index.has(slug)) index.set(slug, []);
      index.get(slug).push(file);
    }
  }
  return new Map([...index].sort(([a], [b]) => a.localeCompare(b)));
}

// Detox matches a spec by literal path substring, so a wholly-owned directory stands in for every
// spec beneath it. Never collapses to the scan root itself.
function collapseToDirectories(teamPaths, allPaths, rootRel) {
  const tally = (paths, into) => {
    for (const filePath of paths) {
      let dir = path.dirname(filePath);
      while (dir.startsWith(`${rootRel}/`)) {
        into.set(dir, (into.get(dir) ?? 0) + 1);
        dir = path.dirname(dir);
      }
    }
  };
  const total = new Map();
  const owned = new Map();
  tally(allPaths, total);
  tally(teamPaths, owned);

  const needles = new Set();
  for (const filePath of teamPaths) {
    let best;
    let dir = path.dirname(filePath);
    while (dir.startsWith(`${rootRel}/`)) {
      if (owned.get(dir) === total.get(dir)) best = dir;
      dir = path.dirname(dir);
    }
    needles.add(best ? `${best}/` : filePath);
  }
  return [...needles].sort();
}

export function createTeamExpander({ files, specRoot, runner }) {
  const index = buildTeamIndex(files);
  const isDetox = runner === "detox";
  const rootRel = path.relative(repoRoot, specRoot).replaceAll(path.sep, "/");
  const toRel = filePath => path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
  const allRel = files.map(toRel);

  return {
    knownSlugs: TEAM_SLUGS,
    ownedSlugs: [...index.keys()],
    specCount: slug => index.get(slug)?.length ?? 0,
    specs: slug => index.get(slug) ?? [],
    // [] when the team owns nothing here. The caller warns; it must never mean "match everything".
    expand(slug) {
      const teamFiles = index.get(slug);
      if (!teamFiles?.length) return [];
      return isDetox
        ? collapseToDirectories(teamFiles.map(toRel), allRel, rootRel)
        : teamFiles.map(file => SPEC_ANCHOR + escapeLiteral(path.basename(file)));
    },
  };
}

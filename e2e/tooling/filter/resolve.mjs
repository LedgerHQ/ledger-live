#!/usr/bin/env node
/* eslint-disable no-console */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { joinFilter, splitFilter } from "./escaping.mjs";
import { isRuntimeGeneratedTag } from "./generatedTags.mjs";
import { findTestFiles as findSpecFiles, filterTestFiles } from "./selectSpecs.mjs";
import { TEAM_SLUGS, createTeamExpander } from "./teamSpecs.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "../../..");
const genericCoinFrameworkFamiliesPath = path.join(
  repoRoot,
  "libs/ledger-live-common/src/bridge/generic-coin-framework/genericCoinFrameworkFamilies.json",
);

const GENERIC_COIN_FRAMEWORK_ALIASES = new Set([
  "generic-family",
  "@generic-family",
  "generic-coin-framework",
  "@generic-coin-framework",
]);

function readEnabledGenericCoinFrameworkFamilies() {
  const familyFlags = JSON.parse(fs.readFileSync(genericCoinFrameworkFamiliesPath, "utf8"));
  return Object.entries(familyFlags)
    .filter(([, isEnabled]) => isEnabled)
    .map(([family]) => family);
}

// A zero-width lookahead group. The desktop composite wraps whatever we emit as
//   "$device_tag.*(RESOLVED)|(RESOLVED).*$device_tag"
// and a zero-width RESOLVED matches at position 0 of the grep title, so the second alternative
// evaluates every lookahead against the WHOLE title and then requires the device tag after it:
// the result is a true AND of every conjunct with the device.
function conjunction(groups) {
  return groups
    .filter(Boolean)
    .map(group => `(?=.*(${group}))`)
    .join("");
}

export function resolveBaseFilter(input, options = {}) {
  const { enabledGenericCoinFrameworkFamilies = readEnabledGenericCoinFrameworkFamilies() } =
    options;

  const parts = splitFilter(input);
  const genericCoinFrameworkTags = enabledGenericCoinFrameworkFamilies.map(
    family => `@family-${family}`,
  );
  let expandedGenericCoinFramework = false;
  const resolvedParts = [];

  for (const part of parts) {
    if (GENERIC_COIN_FRAMEWORK_ALIASES.has(part)) {
      expandedGenericCoinFramework = true;
      resolvedParts.push(...genericCoinFrameworkTags);
      continue;
    }

    resolvedParts.push(part);
  }

  return {
    filter: joinFilter(resolvedParts),
    expandedTags: expandedGenericCoinFramework ? genericCoinFrameworkTags : [],
  };
}

// Mirrors run-e2e-playwright-tests/action.yml exactly: it rewrites spaces to "|" ONLY when the
// filter has a space and carries no "|" of its own. We pre-apply that here so the meaning survives
// once WE add a "|" (the "@smoke|" prefix, or a team conjunct) — which would otherwise suppress the
// composite's rewrite and silently turn a space-separated filter into a literal phrase.
// Detox is unaffected either way (filterTestFiles splits on /[\s,|]+/).
export function normalizeAlternatives(filter) {
  const text = String(filter);
  if (!/ /.test(text) || text.includes("|")) return text;
  return text.split(/\s+/).filter(Boolean).join("|");
}

export function applySmokeFilter(filter, smokeTests) {
  if (!smokeTests) return filter;
  // "|" not " ": the desktop composite only rewrites spaces to "|" when the filter carries no "|"
  // of its own (run-e2e-playwright-tests/action.yml), so a space-joined prefix turned "@smoke"
  // into a dead alternative for every multi-pattern filter. Mobile is unaffected
  // (filterTestFiles splits on /[\s,|]+/ either way) and the INPUTS_TEST_FILTER
  // `.includes("@smoke")` contract still holds.
  return filter ? `@smoke|${filter}` : "@smoke";
}

function hasMatch(files, pattern) {
  let matcher;
  try {
    matcher = new RegExp(pattern, "i");
  } catch {
    console.warn(`::warning title=E2E filter check skipped::${pattern} is not a valid regex`);
    return true;
  }

  return files.some(filePath => {
    if (matcher.test(filePath)) return true;
    return matcher.test(fs.readFileSync(filePath, "utf8"));
  });
}

function warnZeroMatches(checkDir, files, baseFilter, expandedTags, runner) {
  if (!checkDir) return;

  // Decide "0 matches" the same way the target runner actually selects tests, so the warning
  // can't disagree with what runs:
  // - detox (mobile) selects whole spec files by path + declared @-tags (selectSpecs.filterTestFiles).
  //   Content-only filters (a TMS id, a describe/it title) select nothing, so they MUST warn.
  // - playwright (desktop) selects by test title via --grep, approximated by a regex over the
  //   spec path and content.
  const isDetox = runner === "detox";

  if (files.length === 0) {
    console.warn(`::warning title=E2E filter check skipped::No test files found in ${checkDir}`);
    return;
  }

  const selectsSomething = isDetox
    ? pattern => filterTestFiles(files, pattern).length > 0
    : pattern => hasMatch(files, pattern);

  // Only the playwright check is an approximation (a regex over spec path/content), so it alone
  // can miss tags that buildTags() attaches at collection time. The detox check *is* how the
  // mobile runner selects specs, so a 0-match there is a real empty run and must stay a warning.
  const isUnverifiableTag = tag => !isDetox && isRuntimeGeneratedTag(tag);

  for (const tag of expandedTags) {
    if (selectsSomething(tag)) continue;
    // Family tags are attached by buildTags() at collection time, so a spec that carries one
    // never spells it out. Only flag a tag that isn't a real family either.
    if (isUnverifiableTag(tag)) {
      // stderr, like every other message here: stdout carries the resolved filter to the workflow.
      console.warn(
        `::notice title=E2E tag not statically verifiable::${tag} is generated at runtime (buildTags); its specs can't be detected before the run`,
      );
      continue;
    }
    console.warn(`::warning title=Missing E2E tag::${tag} has no matching specs in ${checkDir}`);
  }

  // filterTestFiles already splits on whitespace/","/"|"; the playwright regex needs "|" alternation.
  const baseFilterPattern = isDetox
    ? baseFilter
    : baseFilter.split(/\s+/).filter(Boolean).join("|");
  if (baseFilter && !selectsSomething(baseFilterPattern)) {
    // The filter is an OR: one runtime-generated tag is enough for the run to select specs,
    // so "0 matches" here would be an artefact of the static check, not a real empty run.
    const runtimeTags = splitFilter(baseFilter).filter(isUnverifiableTag);
    if (runtimeTags.length > 0) {
      console.warn(
        `::notice title=E2E filter not statically verifiable::${runtimeTags.join(", ")} ${runtimeTags.length === 1 ? "is" : "are"} generated at runtime (buildTags); matching specs can't be detected before the run`,
      );
      return;
    }
    console.warn(
      `::warning title=E2E filter has no matches::${baseFilter} matched 0 specs in ${checkDir}`,
    );
  }
}

// Resolves the workflow inputs into the two values the jobs need:
//   filter        — the resolved PATTERN string, unchanged in meaning. On mobile it is also the
//                   INPUTS_TEST_FILTER contract that several specs read as `.includes("@smoke")`.
//   runner_filter — what the runner actually selects with: the conjunct grep string on desktop,
//                   the intersected spec list on mobile.
// With no team selected the two are byte-identical.
export function resolveE2eSelection({
  input = "",
  smokeTests = false,
  checkDir = "",
  runner = "playwright",
  team = "",
  invertFilter = false,
} = {}) {
  const isDetox = runner === "detox";
  const specRoot = checkDir ? path.resolve(repoRoot, checkDir) : "";
  const specFiles = specRoot ? findSpecFiles(specRoot) : []; // scanned ONCE, reused below

  const selectedTeam = String(team ?? "")
    .trim()
    .toLowerCase();
  const hasTeam = Boolean(selectedTeam) && selectedTeam !== "all";

  const { filter: rawBaseFilter, expandedTags } = resolveBaseFilter(input);
  const baseFilter = isDetox ? rawBaseFilter : normalizeAlternatives(rawBaseFilter);

  let ok = true;
  const notes = [];

  // Filtering by team is the dropdown's job, and only the dropdown ANDs. A `@team-…` pattern would
  // otherwise be treated as an ordinary literal, match nothing, and (on mobile) skip every test job
  // while the run stayed green.
  const teamTokens = splitFilter(input)
    .flatMap(part => part.split(/\s+/))
    .filter(Boolean)
    .filter(token => /^@?team-/i.test(token));
  if (teamTokens.length > 0) {
    console.warn(
      `::error title=Use the team dropdown::${teamTokens.join(", ")} is not a test_filter pattern; pick the team in the "team" dropdown instead (one of: ${TEAM_SLUGS.join(", ")})`,
    );
    ok = false;
  }

  if (hasTeam && invertFilter) {
    // The composite applies --grep-invert to the whole pattern, team conjunct included, so this
    // would run every OTHER team's specs — the exact opposite of what the dropdown promises.
    console.warn(
      `::error title=E2E team filter cannot be inverted::team=${selectedTeam} with invert_filter=true would run every other team's specs; drop one of the two`,
    );
    ok = false;
  }
  if (hasTeam && !TEAM_SLUGS.includes(selectedTeam)) {
    console.warn(
      `::error title=Unknown E2E team::"${team}" is not a team. Pick one of: all, ${TEAM_SLUGS.join(", ")}`,
    );
    ok = false;
  }
  // Never let a deliberately narrow request silently widen into the whole suite.
  if (String(input).trim() && !baseFilter && !hasTeam) {
    console.warn(
      `::error title=E2E filter resolved to nothing::"${input}" expanded to an empty filter; refusing to run the whole suite`,
    );
    ok = false;
  }

  warnZeroMatches(checkDir, specFiles, baseFilter, expandedTags, runner);

  const filter = applySmokeFilter(baseFilter, smokeTests);
  if (!ok || !hasTeam) return { filter, runner_filter: filter, ok, notes };

  const expander = specFiles.length
    ? createTeamExpander({ files: specFiles, specRoot, runner })
    : null;
  const teamPatterns = expander?.expand(selectedTeam) ?? [];
  if (teamPatterns.length === 0) {
    // Unconditional: a team that owns nothing intersected with ANY filter is still nothing. Falling
    // through with the bare filter would drop the team constraint and run every other team's specs
    // green, while the run-name and job summary still claimed the team.
    console.warn(
      `::warning title=E2E team owns no specs::team "${selectedTeam}" owns no spec in ${checkDir}`,
    );
    console.warn(
      `::error title=E2E selection is empty::team=${selectedTeam} selects 0 specs in ${checkDir}; refusing to run the unnarrowed filter`,
    );
    return { filter, runner_filter: filter, ok: false, notes };
  }

  if (!isDetox) {
    // team AND (test_filter alternatives) AND (@smoke) AND device (added by the composite).
    const runnerFilter = conjunction([
      teamPatterns.join("|"),
      smokeTests ? "@smoke" : "",
      baseFilter,
    ]);
    // Desktop cannot compute the true intersection here — that needs Playwright's own collection,
    // which is not available until after the build. This static approximation over the team's own
    // spec files still turns the common empty-AND (e.g. team=swap + Smoke, because swap tags its
    // smoke tests @swapSmoke) into a first-minute warning instead of a 20-minute mystery.
    const teamFiles = expander.specs(selectedTeam);
    for (const conjunct of [smokeTests ? "@smoke" : "", baseFilter]) {
      if (!conjunct) continue;
      const pattern = conjunct.split(/\s+/).filter(Boolean).join("|");
      if (hasMatch(teamFiles, pattern)) continue;
      // A runtime-generated tag is invisible in the source, so its absence proves nothing.
      if (splitFilter(conjunct).some(tag => isRuntimeGeneratedTag(tag))) continue;
      console.warn(
        `::warning title=E2E team filter may select nothing::no ${selectedTeam} spec mentions "${conjunct}"; the run may select 0 tests`,
      );
    }
    console.warn(
      `::notice title=E2E team filter::team=${selectedTeam} -> ${expander.specCount(selectedTeam)} spec file(s) in ${checkDir}`,
    );
    notes.push(`team ${selectedTeam} (${expander.specCount(selectedTeam)} spec files)`);
    return { filter, runner_filter: runnerFilter, ok, notes };
  }

  // detox: a real set intersection, using the runner's own selector on every side, so the check
  // and the run cannot disagree (the invariant warnZeroMatches exists to protect).
  const owned = new Set(expander.specs(selectedTeam));
  let selected = specFiles.filter(file => owned.has(file));
  if (baseFilter) selected = filterTestFiles(selected, baseFilter);
  if (smokeTests) selected = filterTestFiles(selected, "@smoke");

  if (selected.length === 0) {
    console.warn(
      `::error title=E2E selection is empty::team=${selectedTeam} combined with "${baseFilter || "(no filter)"}"${smokeTests ? " and @smoke" : ""} selects 0 specs in ${checkDir}`,
    );
    return { filter, runner_filter: filter, ok: false, notes };
  }

  const needles = selected.map(file => path.relative(repoRoot, file).replaceAll(path.sep, "/"));
  const runnerFilter = needles.join("|");
  // Assert the emitted needles select EXACTLY what we intended — catches a stale or over-broad
  // needle before it silently widens or narrows the run.
  if (filterTestFiles(specFiles, runnerFilter).length !== selected.length) {
    console.warn(
      `::error title=E2E selection is not exact::the emitted spec list does not round-trip through the mobile selector`,
    );
    return { filter, runner_filter: filter, ok: false, notes };
  }
  console.warn(
    `::notice title=E2E team filter::team=${selectedTeam} -> ${selected.length} spec(s) selected in ${checkDir}`,
  );
  notes.push(
    `team ${selectedTeam} (${expander.specCount(selectedTeam)} spec files) -> ${selected.length} selected`,
  );
  return { filter, runner_filter: runnerFilter, ok, notes };
}

// Kept for callers that only want the pattern string (and for the default CLI output).
export function resolveTestFilter(options = {}) {
  return resolveE2eSelection(options).filter;
}

function parseArgs(args) {
  const parsed = {
    input: "",
    smokeTests: false,
    checkDir: "",
    runner: "playwright",
    team: "",
    invertFilter: false,
    githubOutput: false,
    listTeams: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
        parsed.input = args[++i] ?? "";
        break;
      case "--smoke-tests":
        parsed.smokeTests = args[++i] === "true";
        break;
      case "--check-dir":
        parsed.checkDir = args[++i] ?? "";
        break;
      case "--runner":
        parsed.runner = args[++i] ?? "playwright";
        break;
      case "--team":
        parsed.team = args[++i] ?? "";
        break;
      case "--invert-filter":
        parsed.invertFilter = args[++i] === "true";
        break;
      case "--github-output":
        parsed.githubOutput = true;
        break;
      case "--list-teams":
        parsed.listTeams = true;
        break;
      default:
        if (!parsed.input) parsed.input = arg;
        break;
    }
  }

  return parsed;
}

function formatGithubOutput(values) {
  const lines = [];
  for (const [key, value] of Object.entries(values)) {
    const delimiter = `__E2E_${key.toUpperCase()}_${randomUUID()}__`;
    lines.push(`${key}<<${delimiter}`, String(value), delimiter);
  }
  return lines.join("\n");
}

if (process.argv[1] === currentFile) {
  const options = parseArgs(process.argv.slice(2));

  if (options.listTeams) {
    if (!options.checkDir) {
      console.error(
        "--list-teams requires --check-dir, e.g.\n" +
          "  node e2e/tooling/filter/resolve.mjs --list-teams --check-dir e2e/desktop/tests --runner playwright\n" +
          "  node e2e/tooling/filter/resolve.mjs --list-teams --check-dir e2e/mobile/specs  --runner detox",
      );
      process.exit(1);
    }
    const specRoot = path.resolve(repoRoot, options.checkDir);
    const files = findSpecFiles(specRoot);
    if (files.length === 0) {
      // Distinguish a typo from a real but empty tree: both are useless to report counts for.
      console.error(
        `No .spec.ts files under ${options.checkDir} (resolved to ${specRoot}) — check the path.`,
      );
      process.exit(1);
    }
    const expander = createTeamExpander({ files, specRoot, runner: options.runner });
    console.log(`# ${files.length} spec file(s) in ${options.checkDir}`);
    for (const slug of TEAM_SLUGS) {
      console.log(`${slug}\t${expander.specCount(slug)} spec file(s)`);
    }
  } else {
    const { filter, runner_filter: runnerFilter, ok } = resolveE2eSelection(options);
    // stdout must stay empty on failure so the workflow never captures a half-resolved value.
    if (!ok) process.exit(1);
    console.log(
      options.githubOutput ? formatGithubOutput({ filter, runner_filter: runnerFilter }) : filter,
    );
  }
}

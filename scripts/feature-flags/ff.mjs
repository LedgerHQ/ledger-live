#!/usr/bin/env node

/**
 * `ff` — feature-flag catalog / lint / coverage tooling for `@shared/feature-flags`.
 *
 * Reads the flag registry structurally (via the TypeScript compiler API) rather than by
 * executing it, so it needs no TS runtime and matches the repo's `scripts/*.mjs` convention.
 * Firebase keys reuse the exact `lodash/snakeCase` the app uses, so they are guaranteed to
 * match what is actually sent to Firebase Remote Config.
 *
 * Usage:
 *   pnpm ff list [--team <t>] [--status <s>] [--json]
 *   pnpm ff show <flagId>
 *   pnpm ff catalog [--check]
 *   pnpm ff lint
 *   pnpm ff coverage
 */

import ts from "typescript";
import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FLAGS_DIR = join(ROOT, "shared/feature-flags/src/flags");
const CATALOG_PATH = join(ROOT, "shared/feature-flags/CATALOG.md");

// Reuse the exact snakeCase lodash the app uses (so Firebase keys match what is actually sent to
// Remote Config — reimplementing snake_case is the documented footgun for ids with digits/caps).
// lodash isn't hoisted to the repo root, so resolve it from a package that depends on it.
function resolveSnakeCase() {
  const anchors = [
    "features/platform/feature-flags/package.json",
    "shared/feature-flags/package.json",
    "package.json",
  ];
  for (const anchor of anchors) {
    try {
      return createRequire(join(ROOT, anchor))("lodash/snakeCase");
    } catch {
      /* try next anchor */
    }
  }
  throw new Error("ff: could not resolve lodash/snakeCase from any known location.");
}
// Resolved lazily so `lint`/`coverage` (which never need Firebase keys) run with only Node +
// typescript — no lodash — and stay CI-friendly even under a filtered install.
let _snakeCase;
const firebaseKey = id => {
  _snakeCase ??= resolveSnakeCase();
  return `feature_${_snakeCase(id)}`;
};

// --- Gradual meta enforcement -------------------------------------------------------------
// `lint` requires valid metadata only for enrolled flags/teams. Expand these sets as teams
// backfill their flags — no need to document all ~223 at once.
const ENROLLED_TEAMS = new Set([]);
const ENROLLED_FLAGS = new Set(["lwdWallet40", "lwmWallet40", "lldModularDrawer", "llmModularDrawer"]);

const STATUS_LABEL = {
  experiment: "🧪 experiment",
  rollout: "🚀 rollout",
  permanent: "🔒 permanent",
  deprecated: "⚠️ deprecated",
};
const VALID_STATUS = new Set(Object.keys(STATUS_LABEL));
const HELPERS = new Set(["flag", "flagWith", "flagWithRecord"]);

// --- TS literal evaluation ----------------------------------------------------------------
// Evaluates the pure-literal argument nodes (defaults / meta). Anything non-literal falls back
// to its raw source text, which is fine for display purposes.
function evalNode(node, sf) {
  if (!node) return undefined;
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return node.text;
    case ts.SyntaxKind.NumericLiteral:
      return Number(node.text);
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.NullKeyword:
      return null;
    case ts.SyntaxKind.Identifier:
      return node.text === "undefined" ? undefined : node.getText(sf);
    case ts.SyntaxKind.ParenthesizedExpression:
      return evalNode(node.expression, sf);
    case ts.SyntaxKind.PrefixUnaryExpression:
      if (node.operator === ts.SyntaxKind.MinusToken) return -evalNode(node.operand, sf);
      return node.getText(sf);
    case ts.SyntaxKind.BinaryExpression:
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        return evalNode(node.left, sf) + evalNode(node.right, sf);
      }
      return node.getText(sf);
    case ts.SyntaxKind.ArrayLiteralExpression:
      return node.elements.map(el => evalNode(el, sf));
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const obj = {};
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.text ?? prop.name.getText(sf).replace(/^["']|["']$/g, "");
          obj[key] = evalNode(prop.initializer, sf);
        }
      }
      return obj;
    }
    default:
      return node.getText(sf);
  }
}

// Collect the property names of an object-literal node (used for `flagWith` param shapes).
function objectKeys(node, sf) {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties
    .filter(p => ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p))
    .map(p => p.name.text ?? p.name.getText(sf).replace(/^["']|["']$/g, ""));
}

// --- Parse a single flag file into flag records -------------------------------------------
function parseFlagFile(file, team) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out = [];

  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const isExported = stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const decl of stmt.declarationList.declarations) {
      const init = decl.initializer;
      if (!init || !ts.isCallExpression(init)) continue;
      const callee = init.expression;
      if (!ts.isIdentifier(callee) || !HELPERS.has(callee.text)) continue;

      const id = decl.name.getText(sf);
      const helper = callee.text;
      const args = init.arguments;

      let paramShapeNode, defaultsNode, metaNode;
      if (helper === "flag") {
        [defaultsNode, metaNode] = [args[0], args[1]];
      } else {
        [paramShapeNode, defaultsNode, metaNode] = [args[0], args[1], args[2]];
      }

      const defaults = defaultsNode ? evalNode(defaultsNode, sf) : {};
      const meta = metaNode ? evalNode(metaNode, sf) : undefined;
      const paramKeys =
        helper === "flagWith"
          ? objectKeys(paramShapeNode, sf)
          : Object.keys(defaults?.params ?? {});

      out.push({
        id,
        team,
        file: file.slice(ROOT.length + 1),
        helper,
        enabled: defaults?.enabled === true,
        params: defaults?.params,
        paramKeys,
        meta,
      });
    }
  }
  return out;
}

// --- Load the whole registry --------------------------------------------------------------
function loadFlags() {
  const teams = readdirSync(FLAGS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith("team-"))
    .map(d => d.name);

  const flags = [];
  for (const team of teams) {
    const dir = join(FLAGS_DIR, team);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".ts") || f === "index.ts" || f.endsWith(".test.ts")) continue;
      flags.push(...parseFlagFile(join(dir, f), team));
    }
  }
  flags.sort((a, b) => a.team.localeCompare(b.team) || a.id.localeCompare(b.id));
  return flags;
}

// --- Usage scanning (single-pass greps) ---------------------------------------------------
// One grep pass with a single regex, then filter/tally in JS — far faster than one pattern per
// flag id (which forces grep to test all ~223 regexes on every line).
function grepAll(regex, dirs) {
  const existingDirs = dirs.map(d => join(ROOT, d)).filter(existsSync);
  if (!existingDirs.length) return "";
  try {
    return execFileSync("grep", ["-rEoh", "--include=*.ts", "--include=*.tsx", regex, ...existingDirs], {
      encoding: "utf8",
      maxBuffer: 1 << 27,
    });
  } catch (e) {
    if (e.status === 1) return ""; // status 1 = no matches
    throw e;
  }
}

function tally(items) {
  const counts = new Map();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  return counts;
}

// useFeature is a React hook used in the apps and in the features/ wrapper layer (e.g.
// useWalletFeaturesConfig reads lwdWallet40). libs/ uses the imperative getFeature API instead.
function scanCodeUsages(ids) {
  const known = new Set(ids);
  const out = grepAll(`useFeature\\(["'][A-Za-z0-9_]+["']`, [
    "apps/ledger-live-desktop/src",
    "apps/ledger-live-mobile/src",
    "features",
  ]);
  const found = [];
  for (const line of out.split("\n")) {
    const m = line.match(/useFeature\(["']([A-Za-z0-9_]+)["']/);
    if (m && known.has(m[1])) found.push(m[1]);
  }
  return tally(found);
}

// Best-effort "referenced under e2e" signal: a single alternation of all ids with word
// boundaries (so `currencyBase` never matches inside `currencyBaseSepolia`).
function scanE2eRefs(ids) {
  if (!ids.length) return new Map();
  const known = new Set(ids);
  const out = grepAll(`\\b(${ids.join("|")})\\b`, [
    "e2e",
    "apps/ledger-live-desktop/tests",
    "apps/ledger-live-mobile/e2e",
  ]);
  const found = out
    .split("\n")
    .map(l => l.trim())
    .filter(l => known.has(l));
  return tally(found);
}

// --- Formatting helpers -------------------------------------------------------------------
const fmtStatus = meta => (meta ? STATUS_LABEL[meta.status] ?? meta.status : "—");
const fmtEnabled = f => (f.enabled ? "on" : "off");
function fmtParamsInline(params) {
  if (!params || typeof params !== "object") return "";
  const parts = Object.entries(params).map(([k, v]) => `${k}=${JSON.stringify(v)}`);
  const s = parts.join(", ");
  return s.length > 80 ? s.slice(0, 77) + "…" : s;
}

// --- Commands -----------------------------------------------------------------------------
function cmdList(flags, opts) {
  let rows = flags;
  if (opts.team) rows = rows.filter(f => f.team === opts.team || f.team === `team-${opts.team}`);
  if (opts.status) rows = rows.filter(f => f.meta?.status === opts.status);
  if (opts.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  const uses = scanCodeUsages(rows.map(f => f.id));
  const w = (s, n) => String(s).padEnd(n);
  console.log(w("FLAG", 34) + w("TEAM", 24) + w("STATUS", 16) + w("DEF", 5) + "USES");
  console.log("-".repeat(90));
  for (const f of rows) {
    console.log(
      w(f.id, 34) +
        w(f.team.replace(/^team-/, ""), 24) +
        w(fmtStatus(f.meta).replace(/^\S+\s/, ""), 16) +
        w(fmtEnabled(f), 5) +
        (uses.get(f.id) ?? 0),
    );
  }
  console.log(`\n${rows.length} flags` + (opts.team || opts.status ? " (filtered)" : ""));
}

function cmdShow(flags, id) {
  const f = flags.find(x => x.id === id);
  if (!f) {
    console.error(`Unknown flag: ${id}`);
    process.exit(1);
  }
  const codeUses = scanCodeUsages([id]).get(id) ?? 0;
  const e2eRefs = scanE2eRefs([id]).get(id) ?? 0;
  console.log(`\n${f.id}   ${fmtStatus(f.meta)}`);
  console.log("─".repeat(60));
  console.log(`Team:         ${f.team.replace(/^team-/, "")}`);
  console.log(`Source:       ${f.file}`);
  console.log(`Firebase key: ${firebaseKey(f.id)}`);
  console.log(`Default:      ${fmtEnabled(f)}${f.params ? `  (params: ${fmtParamsInline(f.params)})` : ""}`);
  console.log(`Code usages:  ${codeUses}   ·   e2e refs: ${e2eRefs}`);
  if (f.meta) {
    console.log(`Owner:        ${f.meta.owner ?? f.team.replace(/^team-/, "")}`);
    if (f.meta.ticket) console.log(`Ticket:       ${f.meta.ticket}`);
    if (f.meta.createdAt) console.log(`Created:      ${f.meta.createdAt}`);
    if (f.meta.targetRemoval) console.log(`Remove by:    ${f.meta.targetRemoval}`);
    if (f.meta.dependsOn?.length) console.log(`Depends on:   ${f.meta.dependsOn.join(", ")}`);
    console.log(`\n${f.meta.description}`);
    if (f.meta.paramsDoc) {
      console.log(`\nParams:`);
      for (const [k, doc] of Object.entries(f.meta.paramsDoc)) console.log(`  • ${k} — ${doc}`);
    }
  } else {
    console.log(`\n(no metadata — add a 3rd argument to ${f.helper}() to document this flag)`);
  }
  console.log("");
}

function buildCatalog(flags) {
  const byTeam = new Map();
  for (const f of flags) {
    if (!byTeam.has(f.team)) byTeam.set(f.team, []);
    byTeam.get(f.team).push(f);
  }
  const documented = flags.filter(f => f.meta);
  const statusCounts = {};
  for (const f of flags) {
    const key = f.meta?.status ?? "undocumented";
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  const lines = [];
  lines.push("<!-- Generated by `pnpm ff catalog`. Do not edit by hand. -->");
  lines.push("");
  lines.push("# Feature Flag Catalog");
  lines.push("");
  lines.push(
    `${flags.length} flags across ${byTeam.size} teams · ${documented.length} documented. ` +
      `Firebase keys follow \`feature_<snake_case(id)>\`. Values shown are the code **defaults** ` +
      `(the actual value in each environment lives in Firebase Remote Config).`,
  );
  lines.push("");
  lines.push(
    "**Status:** " +
      Object.entries(statusCounts)
        .map(([s, n]) => `${STATUS_LABEL[s] ?? s}: ${n}`)
        .join(" · "),
  );
  lines.push("");

  for (const team of [...byTeam.keys()].sort()) {
    const rows = byTeam.get(team);
    lines.push(`## ${team}`);
    lines.push("");
    lines.push("| Flag | Firebase key | Status | Default | Description |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const f of rows) {
      const desc = f.meta?.description?.replace(/\s+/g, " ").trim() ?? "";
      lines.push(
        `| \`${f.id}\` | \`${firebaseKey(f.id)}\` | ${fmtStatus(f.meta)} | ${fmtEnabled(f)} | ${desc} |`,
      );
    }
    lines.push("");
  }

  const withParamsDoc = documented.filter(f => f.meta.paramsDoc && Object.keys(f.meta.paramsDoc).length);
  if (withParamsDoc.length) {
    lines.push("## Documented parameters");
    lines.push("");
    for (const f of withParamsDoc) {
      lines.push(`### \`${f.id}\``);
      lines.push("");
      if (f.meta.dependsOn?.length) {
        lines.push(`Depends on: ${f.meta.dependsOn.map(d => `\`${d}\``).join(", ")}`);
        lines.push("");
      }
      lines.push("| Param | Default | Description |");
      lines.push("| --- | --- | --- |");
      for (const [k, doc] of Object.entries(f.meta.paramsDoc)) {
        const def = f.params && k in f.params ? JSON.stringify(f.params[k]) : "—";
        lines.push(`| \`${k}\` | ${def} | ${doc} |`);
      }
      lines.push("");
    }
  }

  return lines.join("\n") + "\n";
}

function cmdCatalog(flags, check) {
  const content = buildCatalog(flags);
  if (check) {
    const current = existsSync(CATALOG_PATH) ? readFileSync(CATALOG_PATH, "utf8") : "";
    if (current !== content) {
      console.error("CATALOG.md is out of date. Run `pnpm ff catalog` and commit the result.");
      process.exit(1);
    }
    console.log("CATALOG.md is up to date.");
    return;
  }
  writeFileSync(CATALOG_PATH, content);
  console.log(`Wrote ${CATALOG_PATH.slice(ROOT.length + 1)} (${flags.length} flags).`);
}

function cmdLint(flags) {
  const ids = new Set(flags.map(f => f.id));
  const errors = [];
  const warnings = [];
  const today = new Date().toISOString().slice(0, 10);

  let undocumented = 0;
  for (const f of flags) {
    const enrolled = ENROLLED_FLAGS.has(f.id) || ENROLLED_TEAMS.has(f.team);
    if (!f.meta) {
      if (enrolled) errors.push(`${f.id}: enrolled flag is missing metadata.`);
      else undocumented++; // non-enrolled: counted in the summary, not warned per-flag
      continue;
    }
    const m = f.meta;
    if (!m.description || typeof m.description !== "string") errors.push(`${f.id}: meta.description is required.`);
    if (!VALID_STATUS.has(m.status)) errors.push(`${f.id}: invalid status "${m.status}".`);
    for (const dep of m.dependsOn ?? []) {
      if (!ids.has(dep)) errors.push(`${f.id}: dependsOn references unknown flag "${dep}".`);
    }
    for (const key of Object.keys(m.paramsDoc ?? {})) {
      if (f.paramKeys.length && !f.paramKeys.includes(key)) {
        errors.push(`${f.id}: paramsDoc key "${key}" is not a declared param.`);
      }
    }
    // Date-form targetRemoval in the past is an error; version-form is left to humans.
    if (m.targetRemoval && /^\d{4}-\d{2}-\d{2}$/.test(m.targetRemoval) && m.targetRemoval < today) {
      errors.push(`${f.id}: targetRemoval ${m.targetRemoval} has passed — remove the flag or update the date.`);
    }
  }

  for (const w of warnings) console.warn(`  warn  ${w}`);
  if (errors.length) {
    console.error(`\n✖ ${errors.length} error(s):`);
    for (const e of errors) console.error(`  error ${e}`);
    process.exit(1);
  }
  console.log(
    `✓ feature-flag lint passed (${flags.length} flags · ${flags.filter(f => f.meta).length} documented · ` +
      `${undocumented} undocumented · ${ENROLLED_FLAGS.size + ENROLLED_TEAMS.size} enrolment rules).`,
  );
}

function cmdCoverage(flags) {
  const uses = scanCodeUsages(flags.map(f => f.id));
  const e2e = scanE2eRefs(flags.map(f => f.id));
  const noCode = flags.filter(f => (uses.get(f.id) ?? 0) === 0);
  const noE2e = flags.filter(f => (e2e.get(f.id) ?? 0) === 0);
  const orphans = flags.filter(f => (uses.get(f.id) ?? 0) === 0 && (e2e.get(f.id) ?? 0) === 0);

  console.log(`\nCoverage over ${flags.length} flags:`);
  console.log(`  • ${noCode.length} with no useFeature() call in app code (dead-flag candidates)`);
  console.log(`  • ${noE2e.length} not referenced anywhere under e2e`);
  console.log(`  • ${orphans.length} orphans (neither app code nor e2e)`);
  if (orphans.length) {
    console.log(`\nOrphans:`);
    for (const f of orphans) console.log(`  ${f.id}  (${f.team.replace(/^team-/, "")})`);
  }
  console.log("");
}

// --- CLI entrypoint -----------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--check") opts.check = true;
    else if (a === "--team") opts.team = argv[++i];
    else if (a === "--status") opts.status = argv[++i];
    else opts._.push(a);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const [cmd, arg] = opts._;
  const flags = loadFlags();

  switch (cmd) {
    case "list":
      return cmdList(flags, opts);
    case "show":
      return cmdShow(flags, arg);
    case "catalog":
      return cmdCatalog(flags, opts.check);
    case "lint":
      return cmdLint(flags);
    case "coverage":
      return cmdCoverage(flags);
    default:
      console.log(
        [
          "ff — feature-flag tooling",
          "",
          "  pnpm ff list [--team <t>] [--status <s>] [--json]   list flags",
          "  pnpm ff show <flagId>                               show one flag in detail",
          "  pnpm ff catalog [--check]                           (re)generate CATALOG.md",
          "  pnpm ff lint                                        validate metadata (CI)",
          "  pnpm ff coverage                                    find dead / orphan flags",
        ].join("\n"),
      );
  }
}

main();

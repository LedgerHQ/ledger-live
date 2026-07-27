#!/usr/bin/env node
// @flow-off
/**
 * i18n plural coverage check / fixer for the English source locales.
 *
 * Context (LIVE-33399): i18next (v4 JSON) resolves plurals using the display
 * language's CLDR categories. Smartling only produces the plural forms that
 * exist in the English source. English uses `_one` / `_other`, so languages
 * that need extra categories (Russian: `_few` + `_many`, French/Spanish/
 * Portuguese: `_many`) never get those keys and fall back to English.
 *
 * TEMPORARY fix: duplicate every genuine plural group's plural value into the
 * missing `_few` / `_many` keys so Smartling has a source string to translate.
 *
 * Usage:
 *   node scripts/i18n-plurals.mjs            # check, exits 1 if keys are missing
 *   node scripts/i18n-plurals.mjs --fix      # add the missing keys in place
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "apps/ledger-live-desktop/static/i18n/en/app.json",
  "apps/ledger-live-mobile/src/locales/en/common.json",
];

// CLDR plural categories we recognise as suffixes.
const CLDR = new Set(["zero", "one", "two", "few", "many", "other"]);
// Categories every genuine plural group must expose for our supported languages
// (ru needs few + many; fr/es/pt need many). Arabic (zero/two) is not enabled.
const REQUIRED = ["few", "many"];

const KEYED = /^(\s*)"((?:[^"\\]|\\.)*)"\s*:\s*(.*)$/;

/**
 * Parse a pretty-printed JSON file line-by-line, tracking object frames so we
 * can locate sibling plural keys with their exact source line & value. We stay
 * at the text level (rather than JSON.parse) to keep insertions surgical and
 * avoid reordering integer-like keys on a round-trip.
 */
function parse(lines) {
  const frames = []; // stack of { children: [] }
  const completed = []; // frames popped, in completion order
  const pushFrame = () => frames.push({ children: [] });
  const popFrame = () => completed.push(frames.pop());
  pushFrame(); // implicit root

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === "") continue;

    const m = raw.match(KEYED);
    if (m) {
      const [, indent, key, rest] = m;
      if (rest === "{" || rest === "[") {
        frames[frames.length - 1].children.push({ key, line: i, indent, isLeaf: false });
        pushFrame();
      } else {
        const hasComma = /,\s*$/.test(rest);
        const rawValue = rest.replace(/,\s*$/, "").trim();
        frames[frames.length - 1].children.push({
          key,
          line: i,
          indent,
          isLeaf: true,
          rawValue,
          hasComma,
        });
      }
      continue;
    }

    // Non-keyed structural lines.
    if (trimmed === "{" || trimmed === "[") {
      pushFrame();
    } else if (trimmed[0] === "}" || trimmed[0] === "]") {
      popFrame();
    }
    // Bare leaf array items ("foo",) are ignored: never plural groups.
  }
  return completed;
}

/** Build plural groups from a frame's direct children. */
function groupsOf(frame) {
  const byStem = new Map();
  for (const child of frame.children) {
    const idx = child.key.lastIndexOf("_");
    if (idx <= 0) continue;
    const suf = child.key.slice(idx + 1);
    if (!CLDR.has(suf)) continue;
    const stem = child.key.slice(0, idx);
    if (!byStem.has(stem)) byStem.set(stem, { stem, forms: new Map(), base: null });
    byStem.get(stem).forms.set(suf, child);
  }
  if (byStem.size === 0) return [];
  // Attach base key (a sibling whose name equals the stem) when present.
  for (const child of frame.children) {
    if (byStem.has(child.key)) byStem.get(child.key).base = child;
  }
  return [...byStem.values()];
}

/**
 * Decide whether a group is a genuine count-plural and, if so, what to add.
 * Returns null for non-plurals / false positives.
 */
function planGroup(group) {
  const other = group.forms.get("other");
  const base = group.base && group.base.isLeaf ? group.base : null;
  // Genuine = has an `_other` form OR a leaf base key acting as the plural.
  if (!other && !base) return null;
  // `_two` in an English source signals explicit index keys (e.g. dependency
  // step messages), not CLDR plurals. Skip to avoid corrupting them.
  if (group.forms.has("two")) return null;

  const source = other || base || group.forms.get("one");
  if (!source || !source.isLeaf) return null;

  const missing = REQUIRED.filter(suf => !group.forms.has(suf));
  if (missing.length === 0) return null;

  // Anchor = the last existing member line of the group.
  const members = [...group.forms.values()];
  if (base) members.push(base);
  const anchor = members.reduce((a, b) => (b.line > a.line ? b : a));

  return { stem: group.stem, missing, value: source.rawValue, anchor };
}

function run({ fix }) {
  let totalMissing = 0;
  let totalGroups = 0;

  for (const rel of FILES) {
    const abs = join(REPO_ROOT, rel);
    const original = readFileSync(abs, "utf8");
    const lines = original.split("\n");
    const frames = parse(lines);

    const plans = [];
    for (const frame of frames) {
      for (const group of groupsOf(frame)) {
        const plan = planGroup(group);
        if (plan) plans.push(plan);
      }
    }

    if (plans.length === 0) {
      console.log(`✓ ${rel}: all plural groups expose [${REQUIRED.join(", ")}]`);
      continue;
    }

    totalGroups += plans.length;
    for (const p of plans) {
      totalMissing += p.missing.length;
      console.log(
        `${fix ? "＋" : "✗"} ${rel}: "${p.stem}" missing ${p.missing.map(s => `_${s}`).join(", ")}`,
      );
    }

    if (!fix) continue;

    // Apply insertions bottom-up so line indices stay valid.
    const insertions = plans
      .map(p => {
        const newLines = p.missing.map(suf => `${p.anchor.indent}"${p.stem}_${suf}": ${p.value}`);
        return { line: p.anchor.line, appendComma: !p.anchor.hasComma, newLines };
      })
      .sort((a, b) => b.line - a.line);

    for (const ins of insertions) {
      if (ins.appendComma) {
        lines[ins.line] = lines[ins.line].replace(/\s*$/, "") + ",";
      }
      const withCommas = ins.newLines.map((l, i) =>
        ins.appendComma && i === ins.newLines.length - 1 ? l : `${l},`,
      );
      lines.splice(ins.line + 1, 0, ...withCommas);
    }

    const out = lines.join("\n");
    // Validate we produced parseable JSON before writing.
    JSON.parse(out);
    writeFileSync(abs, out);
    console.log(`✓ ${rel}: added ${plans.reduce((n, p) => n + p.missing.length, 0)} keys`);
  }

  if (!fix && totalMissing > 0) {
    console.error(
      `\n✗ ${totalMissing} plural key(s) across ${totalGroups} group(s) are missing ` +
        `required forms [${REQUIRED.join(", ")}].\n` +
        `  Russian and other languages fall back to English for these counts.\n` +
        `  Run:  node scripts/i18n-plurals.mjs --fix\n` +
        `  (adds the missing _few/_many keys so Smartling can translate them).`,
    );
    process.exit(1);
  }
  console.log(fix ? "\nDone." : "\n✓ All plural groups covered.");
}

run({ fix: process.argv.includes("--fix") });

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const CODEOWNERS_LOCATIONS = [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"];
const ALLOW_OVERRIDE = "codeowners-check: allow-override";

function parseCodeowners(content) {
  const rules = [];
  let allowOverride = false;
  content.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    if (!line) {
      allowOverride = false;
      return;
    }
    if (line.startsWith("#")) {
      if (line.includes(ALLOW_OVERRIDE)) allowOverride = true;
      return;
    }
    const [pattern, ...owners] = line.split(/\s+/);
    rules.push({ line: index + 1, pattern, owners, allowOverride });
  });
  return rules;
}

function escapeRegExp(literal) {
  return literal.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function globToRegExpSource(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        const atSegmentStart = i === 0 || glob[i - 1] === "/";
        const next = glob[i + 2];
        if (atSegmentStart && next === "/") {
          source += "(?:.*/)?";
          i += 2;
          continue;
        }
        if (atSegmentStart && next === undefined) {
          source += ".*";
          i += 1;
          continue;
        }
        while (glob[i + 1] === "*") i++;
      }
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += escapeRegExp(char);
    }
  }
  return source;
}

// GitHub CODEOWNERS follows gitignore rules, case-sensitively, without `!` or `[ ]`.
function compilePattern(pattern) {
  const directoryOnly = pattern.endsWith("/");
  let body = pattern.replace(/\/+$/, "");
  const anchored = body.startsWith("/") || body.includes("/");
  body = body.replace(/^\/+/, "");
  const prefix = anchored ? "^" : "^(?:.*/)?";
  const suffix = directoryOnly ? "/.*$" : "(?:/.*)?$";
  const regex = new RegExp(prefix + globToRegExpSource(body) + suffix);
  const bareName = !anchored && !body.includes("**");
  const segment = bareName ? new RegExp(`^${globToRegExpSource(body)}$`) : null;
  return { regex, bareName, segment };
}

function compileRules(rules) {
  return rules.map(rule => ({ ...rule, ...compilePattern(rule.pattern) }));
}

function resolveOwners(compiledRules, file) {
  let owners = [];
  for (const rule of compiledRules) {
    if (rule.regex.test(file)) owners = rule.owners;
  }
  return owners;
}

function locationOf(file, segment) {
  const parts = file.split("/");
  const index = parts.findIndex(part => segment.test(part));
  return index <= 0 ? "/" : `${parts.slice(0, index).join("/")}/`;
}

function analyse(rules, files) {
  const compiled = compileRules(rules).map(rule => ({
    ...rule,
    matches: 0,
    wins: 0,
    locations: new Set(),
    overriddenBy: new Map(),
    takenFrom: new Map(),
  }));
  let unowned = 0;

  for (const file of files) {
    const hits = [];
    for (const rule of compiled) {
      if (!rule.regex.test(file)) continue;
      rule.matches++;
      if (rule.bareName) rule.locations.add(locationOf(file, rule.segment));
      hits.push(rule);
    }
    if (!hits.length) {
      unowned++;
      continue;
    }
    const winner = hits[hits.length - 1];
    winner.wins++;
    for (const loser of hits.slice(0, -1)) {
      loser.overriddenBy.set(winner.line, winner);
    }
    if (!winner.owners.length) continue;
    for (let k = hits.length - 2; k >= 0; k--) {
      const loser = hits[k];
      if (!loser.owners.length) break;
      if (loser.owners.join(" ") === winner.owners.join(" ")) continue;
      const taken = winner.takenFrom.get(loser.line) || { rule: loser, files: [] };
      taken.files.push(file);
      winner.takenFrom.set(loser.line, taken);
      break;
    }
  }

  const findings = [];
  const add = (rule, message) => findings.push({ line: rule.line, pattern: rule.pattern, message });

  for (const rule of compiled) {
    if (!rule.matches) {
      add(rule, "matches no tracked file; delete it or fix the path");
      continue;
    }
    if (!rule.wins) {
      const by = [...rule.overriddenBy.values()].map(r => `L${r.line} ${r.pattern}`).join(", ");
      add(rule, `never takes effect: every file it matches is re-owned by a later rule (${by})`);
    }
    if (rule.bareName && rule.locations.size > 1) {
      const where = [...rule.locations].sort().slice(0, 5).join(", ");
      add(
        rule,
        `unanchored pattern matches in ${rule.locations.size} places (${where}); ` +
          `prefix it with "/" for the root only, or "**/" to match everywhere on purpose`,
      );
    }
    if (rule.allowOverride) continue;
    const taken = [...rule.takenFrom.values()].filter(
      ({ rule: loser }) => rule.matches > loser.matches,
    );
    if (taken.length) {
      const total = taken.reduce((sum, { files }) => sum + files.length, 0);
      const detail = taken
        .sort((a, b) => b.files.length - a.files.length)
        .slice(0, 5)
        .map(
          ({ rule: loser, files }) =>
            `L${loser.line} ${loser.pattern} ${loser.owners.join(" ")} (${files.length}, e.g. ${files[0]})`,
        )
        .join("; ");
      add(
        rule,
        `broad rule placed after narrower ones: takes ${total} file(s) from ${taken.length} narrower earlier rule(s): ${detail}. ` +
          `Move it above them, or put "# ${ALLOW_OVERRIDE}" above its block if intended`,
      );
    }
  }

  findings.sort((a, b) => a.line - b.line);
  return { findings, unowned, files: files.length, rules: compiled.length };
}

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 30 });
}

function gitRoot(cwd = process.cwd()) {
  return git(["rev-parse", "--show-toplevel"], cwd).trim();
}

function findCodeowners(root) {
  return CODEOWNERS_LOCATIONS.find(location => fs.existsSync(path.join(root, location))) ?? null;
}

function main() {
  const root = gitRoot();
  const relative = findCodeowners(root);
  if (!relative) {
    console.error("No CODEOWNERS file found.");
    process.exit(1);
  }

  const rules = parseCodeowners(fs.readFileSync(path.join(root, relative), "utf8"));
  const files = git(["ls-files"], root).split("\n").filter(Boolean);
  const { findings, unowned, files: fileCount } = analyse(rules, files);

  console.log(
    `Checked ${rules.length} rules in ${relative} against ${fileCount} tracked files (${unowned} unowned).`,
  );
  if (!findings.length) {
    console.log("CODEOWNERS is valid.");
    return;
  }

  const annotate = process.env.GITHUB_ACTIONS === "true";
  for (const { line, pattern, message } of findings) {
    console.log(`${relative}:${line}  ${pattern}  ${message}`);
    if (annotate) {
      const escaped = message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
      console.log(`::error file=${relative},line=${line},title=CODEOWNERS ${pattern}::${escaped}`);
    }
  }
  console.log(`\n${findings.length} CODEOWNERS problem(s) found.`);
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  gitRoot,
  findCodeowners,
  parseCodeowners,
  compilePattern,
  compileRules,
  resolveOwners,
  analyse,
};

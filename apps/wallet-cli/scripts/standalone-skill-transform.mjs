// Single source of truth for the "monorepo skill -> standalone skill" transform.
//
// The canonical skill at .agents/skills/ledger-wallet-cli/SKILL.md is authored for
// monorepo contributors: it is named after its source directory and tells the reader
// to run `pnpm --silent wallet-cli start <command>` from the repo root. Two
// standalone artifacts are derived from it, and both MUST apply the same transform:
//
//   1. the copy embedded in the compiled binary, behind `wallet-cli skill *`
//      (scripts/generate-skills-manifest.mjs);
//   2. the copy published to LedgerHQ/agent-skills
//      (scripts/export-standalone-skill.mjs, run by
//      .github/workflows/sync-wallet-cli-skill.yml).
//
// These used to be a JS rewrite and a shell `sed` pipeline kept semantically
// identical by hand — and they drifted: the embedded copy shipped the pnpm-prefixed
// examples for several releases while the published copy was correct, and the two
// disagreed on the skill's own name. Keep this module the only implementation; it is
// deliberately pure (no fs, no process) so both callers and the unit tests in
// src/test/skills/standalone-skill-transform.test.ts exercise the same code.

/** Skill name of the canonical monorepo source — also its directory name. */
export const MONOREPO_SKILL_NAME = "ledger-wallet-cli";

/**
 * Skill name every standalone artifact uses: the embedded manifest, `skill list`,
 * install directories, sidecars, and the agent-skills publication path
 * (skills/wallet-cli/wallet-cli-usage). `MONOREPO_SKILL_NAME` survives only as a
 * lookup alias — see LEGACY_SKILL_NAMES in src/skills/registry.ts.
 */
export const STANDALONE_SKILL_NAME = "wallet-cli-usage";

/** The monorepo-only run instruction the source is expected to carry, verbatim. */
export const MONOREPO_RUN_INSTRUCTION =
  "Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`";

/** What MONOREPO_RUN_INSTRUCTION becomes for a globally-installed binary. */
export const STANDALONE_INSTALL_LINE =
  "Install globally with a user-preferred package manager — `npm i -g @ledgerhq/wallet-cli`, " +
  "`pnpm add -g @ledgerhq/wallet-cli`, `yarn global add @ledgerhq/wallet-cli`, or " +
  "`bun add -g @ledgerhq/wallet-cli`. Run: `wallet-cli [flags]`.";

/** Command prefix that only works from a monorepo checkout. */
const MONOREPO_COMMAND_PREFIX = "pnpm --silent wallet-cli start";

/**
 * pnpm mentions that are legitimate in a standalone artifact. Everything else
 * tripping the `\bpnpm\b` guard means a monorepo-only invocation leaked through in a
 * shape the rewrite does not know about (e.g. `pnpm --filter @ledgerhq/wallet-cli
 * start ...`), which must fail loudly rather than ship.
 */
const ALLOWED_PNPM_SNIPPETS = ["pnpm add -g @ledgerhq/wallet-cli"];

/**
 * Phrases that only make sense inside the monorepo. Checked against the rewritten
 * output so a reworded source fails the build instead of silently shipping
 * instructions a standalone user cannot follow.
 */
const FORBIDDEN_OUTPUT_PATTERNS = [
  { label: "monorepo-only wallet-cli command", pattern: /pnpm --silent wallet-cli start/ },
  { label: "monorepo-only run instruction", pattern: /repo root/i },
  { label: "monorepo-only pnpm invocation", pattern: /\bpnpm\b/, allow: ALLOWED_PNPM_SNIPPETS },
];

// Leading YAML frontmatter block: `---\n<inner>\n---`. Anchored (and non-global) so
// only the document's own frontmatter matches, never a `---` rule inside the body.
// `\r?` throughout tolerates CRLF checkouts (Windows core.autocrlf), matching
// parseFrontmatterField and the rest of the generator.
const FRONTMATTER_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))/;

const ERROR_PREFIX = "Standalone skill transform failed —";
const ERROR_SUFFIX = "Update scripts/standalone-skill-transform.mjs.";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip every allowed snippet so a guard only sees the text it is meant to police. */
function withoutAllowed(content, allowed) {
  return (allowed ?? []).reduce((acc, snippet) => acc.split(snippet).join(""), content);
}

/** `path`-prefixed label so multi-file callers say which file failed. */
function where(filePath) {
  return filePath ? ` in ${filePath}` : "";
}

/**
 * Read one field out of a SKILL.md YAML frontmatter block, or "" when absent.
 * Callers pass the *rewritten* content so the manifest's identity and description
 * describe the artifact that actually ships, not the monorepo source.
 *
 * @param {string} skillMd
 * @param {string} field
 * @returns {string}
 */
export function parseFrontmatterField(skillMd, field) {
  const frontmatter = skillMd.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return "";
  const line = frontmatter[1].match(new RegExp(`^${escapeRegExp(field)}:\\s*(.*)$`, "m"));
  if (!line) return "";
  return line[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Rename the frontmatter `name:` field, and only that field: the replacement is
 * scoped to the leading frontmatter block and anchored to the exact expected value,
 * so a `name:` line in the body (or an already-renamed skill) is left alone.
 */
function renameFrontmatterSkillName(skillMd) {
  const nameLine = new RegExp(
    `^name:[ \\t]*${escapeRegExp(MONOREPO_SKILL_NAME)}[ \\t]*(\\r?)$`,
    "m",
  );
  return skillMd.replace(FRONTMATTER_RE, (_all, open, inner, close) => {
    return open + inner.replace(nameLine, `name: ${STANDALONE_SKILL_NAME}$1`) + close;
  });
}

/** Replace every monorepo-only command invocation with its standalone equivalent. */
function rewriteCommands(content) {
  // The optional trailing space keeps `<prefix> send ...` from becoming
  // `wallet-cli  send ...` while still handling a bare prefix at end of line.
  return content.replace(new RegExp(`${escapeRegExp(MONOREPO_COMMAND_PREFIX)} ?`, "g"), () => {
    return "wallet-cli ";
  });
}

/** Throw with the offending line quoted, so a failure is actionable without grepping. */
function assertNoForbiddenOutput(content, filePath) {
  for (const { label, pattern, allow } of FORBIDDEN_OUTPUT_PATTERNS) {
    const lines = content.split(/\r?\n/);
    const index = lines.findIndex(line => pattern.test(withoutAllowed(line, allow)));
    if (index === -1) continue;
    throw new Error(
      `${ERROR_PREFIX} ${label} survived the rewrite${where(filePath)} at line ${index + 1}: ` +
        `${JSON.stringify(lines[index])}. ${ERROR_SUFFIX}`,
    );
  }
}

/**
 * Transform the canonical SKILL.md into the standalone form.
 *
 * Positive assertions come first and matter as much as the negative ones: if the
 * source stops carrying an expected marker (someone rewords the run instruction, or
 * renames the skill), a rewrite rule silently becomes a no-op. Failing here turns
 * that into a build error instead of a standalone artifact that quietly lost its
 * install instructions — the exact drift this module exists to prevent.
 *
 * @param {string} skillMd
 * @param {string} [filePath] Skill-relative path, used only in error messages.
 * @returns {string}
 */
export function rewriteSkillMd(skillMd, filePath = "SKILL.md") {
  if (!FRONTMATTER_RE.test(skillMd)) {
    throw new Error(
      `${ERROR_PREFIX} no YAML frontmatter block found${where(filePath)}. ${ERROR_SUFFIX}`,
    );
  }
  if (!skillMd.includes(MONOREPO_RUN_INSTRUCTION)) {
    throw new Error(
      `${ERROR_PREFIX} expected run instruction ${JSON.stringify(MONOREPO_RUN_INSTRUCTION)} not ` +
        `found${where(filePath)}. ${ERROR_SUFFIX}`,
    );
  }

  const rewritten = rewriteCommands(
    renameFrontmatterSkillName(skillMd)
      .split(MONOREPO_RUN_INSTRUCTION)
      .join(STANDALONE_INSTALL_LINE),
  );

  const name = parseFrontmatterField(rewritten, "name");
  if (name !== STANDALONE_SKILL_NAME) {
    throw new Error(
      `${ERROR_PREFIX} frontmatter name is ${JSON.stringify(name)} after the rewrite${where(filePath)}, ` +
        `expected ${JSON.stringify(STANDALONE_SKILL_NAME)}. ${ERROR_SUFFIX}`,
    );
  }
  if (!rewritten.includes(STANDALONE_INSTALL_LINE)) {
    throw new Error(
      `${ERROR_PREFIX} standalone install instruction missing after the rewrite${where(filePath)}. ${ERROR_SUFFIX}`,
    );
  }
  assertNoForbiddenOutput(rewritten, filePath);

  return rewritten;
}

/**
 * Transform a skill file other than SKILL.md (a `references/*.md`).
 *
 * Reference files carry no frontmatter and no run instruction, but they may quote
 * commands — so they get the same command rewrite and the same forbidden-output
 * guard. Today they contain no pnpm at all, which makes this a no-op; without it, a
 * command added to a reference file tomorrow would ship unrewritten and unchecked,
 * because the SKILL.md-only guard never looks at them.
 *
 * @param {string} content
 * @param {string} filePath Skill-relative path, used only in error messages.
 * @returns {string}
 */
export function rewriteReferenceFile(content, filePath) {
  const rewritten = rewriteCommands(content);
  assertNoForbiddenOutput(rewritten, filePath);
  return rewritten;
}

/**
 * Dispatch on the skill-relative posix path.
 *
 * @param {string} posixPath
 * @param {string} content
 * @returns {string}
 */
export function rewriteSkillFile(posixPath, content) {
  return posixPath === "SKILL.md"
    ? rewriteSkillMd(content, posixPath)
    : rewriteReferenceFile(content, posixPath);
}

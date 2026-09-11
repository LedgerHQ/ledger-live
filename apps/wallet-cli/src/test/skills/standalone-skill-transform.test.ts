// Unit tests for the monorepo -> standalone skill transform shared by the skills
// codegen (scripts/generate-skills-manifest.mjs) and the agent-skills export
// (scripts/export-standalone-skill.mjs, run by sync-wallet-cli-skill.yml).
//
// The transform is exercised end-to-end elsewhere (retrieve/list/install/doctor
// tests run against the real generated manifest). These tests cover what those
// cannot: the failure paths, which must fail the build loudly rather than ship a
// standalone artifact that quietly kept monorepo-only instructions.

import { describe, it, expect } from "bun:test";
import {
  MONOREPO_RUN_INSTRUCTION,
  MONOREPO_SKILL_NAME,
  STANDALONE_INSTALL_LINE,
  STANDALONE_SKILL_NAME,
  parseFrontmatterField,
  rewriteReferenceFile,
  rewriteSkillFile,
  rewriteSkillMd,
} from "../../../scripts/standalone-skill-transform.mjs";

/** A minimal but structurally faithful stand-in for the canonical SKILL.md. */
function sourceSkillMd(
  overrides: { name?: string; runInstruction?: string; body?: string } = {},
): string {
  const {
    name = MONOREPO_SKILL_NAME,
    runInstruction = MONOREPO_RUN_INSTRUCTION,
    body = [
      "```bash",
      "pnpm --silent wallet-cli start send ethereum-1 --to 0xDEF... --amount '0.5 ETH'",
      "pnpm --silent wallet-cli start balances ethereum-1",
      "```",
    ].join("\n"),
  } = overrides;

  return [
    "---",
    `name: ${name}`,
    "description: Official Ledger wallet-cli - USB-based CLI.",
    "---",
    "",
    "# wallet-cli",
    "",
    runInstruction,
    "",
    body,
    "",
  ].join("\n");
}

describe("rewriteSkillMd — happy path", () => {
  it("renames the frontmatter skill name to the standalone name", () => {
    const rewritten = rewriteSkillMd(sourceSkillMd());
    expect(rewritten).toContain(`name: ${STANDALONE_SKILL_NAME}`);
    expect(rewritten).not.toContain(`name: ${MONOREPO_SKILL_NAME}`);
    expect(parseFrontmatterField(rewritten, "name")).toBe(STANDALONE_SKILL_NAME);
  });

  it("preserves the description verbatim", () => {
    const rewritten = rewriteSkillMd(sourceSkillMd());
    expect(parseFrontmatterField(rewritten, "description")).toBe(
      "Official Ledger wallet-cli - USB-based CLI.",
    );
  });

  it("replaces the repo-root run instruction with the global install line", () => {
    const rewritten = rewriteSkillMd(sourceSkillMd());
    expect(rewritten).toContain(STANDALONE_INSTALL_LINE);
    expect(rewritten).not.toContain("repo root");
  });

  it("replaces every monorepo-only command occurrence, not just the first", () => {
    const rewritten = rewriteSkillMd(sourceSkillMd());
    expect(rewritten).not.toContain("pnpm --silent wallet-cli start");
    expect(rewritten).toContain("wallet-cli send ethereum-1");
    expect(rewritten).toContain("wallet-cli balances ethereum-1");
  });

  it("rewrites a piped invocation without leaving a double space", () => {
    const rewritten = rewriteSkillMd(
      sourceSkillMd({ body: "pbpaste | pnpm --silent wallet-cli start ring encrypt | pbcopy" }),
    );
    expect(rewritten).toContain("pbpaste | wallet-cli ring encrypt | pbcopy");
    expect(rewritten).not.toContain("wallet-cli  ");
  });

  it("leaves the only legitimate pnpm mention (the global install snippet) intact", () => {
    const rewritten = rewriteSkillMd(sourceSkillMd());
    const pnpmLines = rewritten.split("\n").filter(line => line.includes("pnpm"));
    expect(pnpmLines).toHaveLength(1);
    expect(pnpmLines[0]).toContain("pnpm add -g @ledgerhq/wallet-cli");
  });

  it("is deterministic and idempotent in output for identical input", () => {
    const source = sourceSkillMd();
    expect(rewriteSkillMd(source)).toBe(rewriteSkillMd(source));
  });

  it("handles CRLF input, rewriting content without corrupting line endings", () => {
    const crlf = sourceSkillMd().replace(/\n/g, "\r\n");
    const rewritten = rewriteSkillMd(crlf);
    expect(rewritten).toContain(`name: ${STANDALONE_SKILL_NAME}\r\n`);
    expect(rewritten).toContain(STANDALONE_INSTALL_LINE);
    expect(rewritten).not.toContain("pnpm --silent wallet-cli start");
    // No LF-only lines introduced: every \n is still preceded by \r.
    expect(rewritten.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("renames only the frontmatter name, leaving a same-named body reference alone", () => {
    const rewritten = rewriteSkillMd(
      sourceSkillMd({
        body: `See the canonical source at .agents/skills/${MONOREPO_SKILL_NAME}/.`,
      }),
    );
    expect(rewritten).toContain(`name: ${STANDALONE_SKILL_NAME}`);
    expect(rewritten).toContain(`.agents/skills/${MONOREPO_SKILL_NAME}/.`);
  });
});

describe("rewriteSkillMd — fails loudly instead of drifting", () => {
  it("throws when the expected run instruction was reworded", () => {
    // The rewrite rule would silently no-op and the artifact would ship without any
    // install instruction — the drift this guard exists to catch.
    const reworded = sourceSkillMd({
      runInstruction: "Invoke from the monorepo root: `pnpm --silent wallet-cli start <cmd>`",
    });
    expect(() => rewriteSkillMd(reworded)).toThrow(/expected run instruction/i);
  });

  it("throws when the frontmatter name is not the expected monorepo name", () => {
    const renamed = sourceSkillMd({ name: "something-else" });
    expect(() => rewriteSkillMd(renamed)).toThrow(/frontmatter name/i);
  });

  it("throws when there is no frontmatter block at all", () => {
    expect(() => rewriteSkillMd(`# wallet-cli\n\n${MONOREPO_RUN_INSTRUCTION}\n`)).toThrow(
      /frontmatter/i,
    );
  });

  it("throws on a monorepo-only pnpm invocation the rewrite does not know about", () => {
    const unknownShape = sourceSkillMd({
      body: "pnpm --filter @ledgerhq/wallet-cli start send ethereum-1",
    });
    expect(() => rewriteSkillMd(unknownShape)).toThrow(/pnpm/i);
  });

  it("throws on a surviving repo-root mention elsewhere in the body", () => {
    const extraMention = sourceSkillMd({ body: "Build from the repo root first." });
    expect(() => rewriteSkillMd(extraMention)).toThrow(/repo root/i);
  });

  it("names the offending file and line so the failure is actionable", () => {
    const unknownShape = sourceSkillMd({ body: "pnpm --filter @ledgerhq/wallet-cli start send" });
    expect(() => rewriteSkillMd(unknownShape, "SKILL.md")).toThrow(/in SKILL\.md at line \d+/);
  });
});

describe("rewriteReferenceFile", () => {
  it("leaves prose with no commands untouched", () => {
    const prose = "# Business logic\n\nWhy `receive` verifies on device.\n";
    expect(rewriteReferenceFile(prose, "references/business-logic.md")).toBe(prose);
  });

  it("rewrites commands quoted in a reference file", () => {
    const withCommand = "Run `pnpm --silent wallet-cli start genuine-check` first.\n";
    expect(rewriteReferenceFile(withCommand, "references/business-logic.md")).toBe(
      "Run `wallet-cli genuine-check` first.\n",
    );
  });

  it("guards reference files too, so a leaked monorepo command cannot ship", () => {
    expect(() =>
      rewriteReferenceFile("pnpm --filter @ledgerhq/wallet-cli start send\n", "references/x.md"),
    ).toThrow(/in references\/x\.md/);
  });
});

describe("rewriteSkillFile — dispatch", () => {
  it("applies the full SKILL.md transform for SKILL.md", () => {
    const rewritten = rewriteSkillFile("SKILL.md", sourceSkillMd());
    expect(rewritten).toContain(`name: ${STANDALONE_SKILL_NAME}`);
    expect(rewritten).toContain(STANDALONE_INSTALL_LINE);
  });

  it("applies the reference transform for anything else", () => {
    // No frontmatter and no run instruction, so the SKILL.md path would have thrown.
    expect(rewriteSkillFile("references/business-logic.md", "plain prose\n")).toBe("plain prose\n");
  });
});

describe("parseFrontmatterField", () => {
  it("returns an empty string for a missing field or missing frontmatter", () => {
    expect(parseFrontmatterField(sourceSkillMd(), "nope")).toBe("");
    expect(parseFrontmatterField("# no frontmatter\n", "name")).toBe("");
  });

  it("strips surrounding quotes and tolerates CRLF", () => {
    const quoted = '---\r\nname: "quoted-name"\r\n---\r\n\r\nbody\r\n';
    expect(parseFrontmatterField(quoted, "name")).toBe("quoted-name");
  });
});

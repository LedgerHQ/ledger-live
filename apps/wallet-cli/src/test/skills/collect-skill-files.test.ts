import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectSkillFiles } from "../../../scripts/collect-skill-files.mjs";

// The walker feeds two public artifacts — the skill embedded in the npm binary and
// the copy published to the agent-skills repo — so a symlink escaping the skill tree
// would publish content nobody reviewed. These tests pin that boundary.

let root = "";
let skillDir = "";
let outside = "";

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "collect-skill-files-"));
  skillDir = path.join(root, "skills", "ledger-wallet-cli");
  outside = path.join(root, "outside");
  await mkdir(path.join(skillDir, "references"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await writeFile(path.join(skillDir, "SKILL.md"), "# skill\n");
  await writeFile(path.join(skillDir, "references", "business-logic.md"), "# logic\n");
  await writeFile(path.join(outside, "secret.md"), "AWS_SECRET_ACCESS_KEY=...\n");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("collectSkillFiles", () => {
  it("collects regular files recursively as posix-separated relative paths", async () => {
    const files = await collectSkillFiles(skillDir, { boundary: skillDir });
    expect([...files].sort()).toEqual(["SKILL.md", "references/business-logic.md"]);
  });

  it("accepts a symlink that resolves inside the boundary", async () => {
    await symlink(
      path.join(skillDir, "references", "business-logic.md"),
      path.join(skillDir, "references", "safety.md"),
    );
    const files = await collectSkillFiles(skillDir, { boundary: skillDir });
    expect([...files].sort()).toEqual([
      "SKILL.md",
      "references/business-logic.md",
      "references/safety.md",
    ]);
  });

  it("refuses a symlink that escapes the boundary", async () => {
    // Without this guard the export step would read through the link and publish
    // the target's content to the public agent-skills repository.
    await symlink(path.join(outside, "secret.md"), path.join(skillDir, "references", "leak.md"));
    await expect(collectSkillFiles(skillDir, { boundary: skillDir })).rejects.toThrow(
      /symlink resolves outside/,
    );
  });

  it("names the offending path and its target in the error", async () => {
    await symlink(path.join(outside, "secret.md"), path.join(skillDir, "references", "leak.md"));
    const error = await collectSkillFiles(skillDir, {
      boundary: skillDir,
      label: "ledger-wallet-cli",
    }).catch((e: Error) => e);
    expect((error as Error).message).toContain("ledger-wallet-cli/references/leak.md");
    expect((error as Error).message).toContain("secret.md");
  });

  it("refuses an escaping symlink nested in a subdirectory", async () => {
    await mkdir(path.join(skillDir, "references", "deep"), { recursive: true });
    await symlink(outside, path.join(skillDir, "references", "deep", "elsewhere"));
    await expect(collectSkillFiles(skillDir, { boundary: skillDir })).rejects.toThrow(
      /symlink resolves outside/,
    );
  });

  it("refuses a symlinked directory even inside the boundary", async () => {
    // Descending it would emit the same content under two paths, and a self-link
    // would loop; the manifest hash must stay a function of the real tree.
    await symlink(path.join(skillDir, "references"), path.join(skillDir, "refs"));
    await expect(collectSkillFiles(skillDir, { boundary: skillDir })).rejects.toThrow(
      /does not point to a file/,
    );
  });

  it("refuses a broken symlink instead of silently dropping it", async () => {
    await symlink(path.join(skillDir, "gone.md"), path.join(skillDir, "dangling.md"));
    await expect(collectSkillFiles(skillDir, { boundary: skillDir })).rejects.toThrow(
      /broken symlink/,
    );
  });

  it("allows a cross-skill symlink when the boundary is the whole skills tree", async () => {
    // The manifest generator's boundary: skills may share references with each
    // other, so the same tree that is refused for the public export is allowed here.
    const shared = path.join(root, "skills", "shared");
    await mkdir(shared, { recursive: true });
    await writeFile(path.join(shared, "safety.md"), "# safety\n");
    await symlink(path.join(shared, "safety.md"), path.join(skillDir, "references", "safety.md"));

    await expect(collectSkillFiles(skillDir, { boundary: skillDir })).rejects.toThrow(
      /symlink resolves outside/,
    );
    const files = await collectSkillFiles(skillDir, { boundary: path.join(root, "skills") });
    expect([...files].sort()).toContain("references/safety.md");
  });

  it("resolves the boundary itself, so a symlinked ancestor is not a false positive", async () => {
    // Mirrors a git worktree or macOS /tmp -> /private/tmp: the boundary is reached
    // through a link, so comparing unresolved paths would reject every entry.
    const linkedRoot = path.join(root, "linked-skills");
    await symlink(path.join(root, "skills"), linkedRoot);
    const files = await collectSkillFiles(path.join(linkedRoot, "ledger-wallet-cli"), {
      boundary: path.join(linkedRoot, "ledger-wallet-cli"),
    });
    expect([...files].sort()).toEqual(["SKILL.md", "references/business-logic.md"]);
  });
});

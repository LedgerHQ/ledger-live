import { describe, it, expect, afterEach } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { hashOne, hashSkillFiles } from "./hash";
import { diagnoseSkill, SIDECAR_FILENAME, type SkillFile, type SkillManifest } from "./registry";

const OLDER_SKILL_MD: SkillFile = { path: "SKILL.md", content: "# Older\n" };
const NESTED_REFERENCE: SkillFile = { path: "references/sub/new.md", content: "A new reference\n" };
const NEWER_FILES = [{ path: "SKILL.md", content: "# Newer\n" }, NESTED_REFERENCE];
const NEWER_SKILL: SkillManifest = {
  name: "nested-skill",
  description: "Adds a reference two directories deep.",
  contentHash: hashSkillFiles(NEWER_FILES),
  files: NEWER_FILES,
};

let tmpDir: string | undefined;
afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

async function installOlderSkill(
  recorded: SkillFile[] = [OLDER_SKILL_MD],
): Promise<{ root: string; skillRoot: string }> {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-registrytest-"));
  const root = path.join(tmpDir, "skills");
  const skillRoot = path.join(root, NEWER_SKILL.name);
  await mkdir(skillRoot, { recursive: true });
  await writeFile(path.join(skillRoot, OLDER_SKILL_MD.path), OLDER_SKILL_MD.content, "utf8");
  const sidecar = {
    name: NEWER_SKILL.name,
    cliVersion: "0.0.1",
    contentHash: hashSkillFiles(recorded),
    files: Object.fromEntries(recorded.map(file => [file.path, hashOne(file.content)])),
    installedAt: new Date().toISOString(),
  };
  await writeFile(path.join(skillRoot, SIDECAR_FILENAME), JSON.stringify(sidecar), "utf8");
  return { root, skillRoot };
}

describe("diagnoseSkill", () => {
  it("reports outdated when a new nested path's closest existing parent is inside the skill", async () => {
    const { root, skillRoot } = await installOlderSkill();
    await mkdir(path.join(skillRoot, "references"));

    const diagnosis = await diagnoseSkill(NEWER_SKILL, root);

    expect(diagnosis.status).toBe("outdated");
    expect(diagnosis.changedFiles).toBeUndefined();
  });

  it("reports modified-locally when a new nested path sits under a directory that links outside the skill", async () => {
    const { root, skillRoot } = await installOlderSkill();
    const sharedReferences = path.join(tmpDir!, "shared-references");
    await mkdir(sharedReferences);
    await symlink(sharedReferences, path.join(skillRoot, "references"));

    const diagnosis = await diagnoseSkill(NEWER_SKILL, root);

    expect(diagnosis.status).toBe("modified-locally");
    expect(diagnosis.changedFiles).toEqual([path.join(skillRoot, NESTED_REFERENCE.path)]);
  });

  it("reports modified-locally when the sidecar records a path outside the skill", async () => {
    const outside: SkillFile = { path: "../outside.md", content: "Not part of the skill\n" };
    const { root, skillRoot } = await installOlderSkill([OLDER_SKILL_MD, outside]);
    await writeFile(path.join(skillRoot, outside.path), outside.content, "utf8");

    const diagnosis = await diagnoseSkill(NEWER_SKILL, root);

    expect(diagnosis.status).toBe("modified-locally");
  });
});

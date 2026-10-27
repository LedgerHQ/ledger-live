import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashOne, hashSkillFiles } from "../skills/hash";
import { getSkill, SIDECAR_FILENAME } from "../skills/registry";

const SKILL_NAME = "wallet-cli-usage";

export async function readTrackedFromDisk(
  skillRoot: string,
): Promise<{ path: string; content: string }[]> {
  const skill = getSkill(SKILL_NAME)!;
  const files: { path: string; content: string }[] = [];
  for (const f of skill.files) {
    files.push({ path: f.path, content: await readFile(path.join(skillRoot, f.path), "utf8") });
  }
  return files;
}

/** Rewrite the sidecar so its hashes match the current on-disk files (with a chosen version). */
export async function stampSidecar(skillRoot: string, cliVersion: string): Promise<void> {
  const files = await readTrackedFromDisk(skillRoot);
  const sidecar = {
    name: SKILL_NAME,
    cliVersion,
    contentHash: hashSkillFiles(files),
    files: Object.fromEntries(files.map(f => [f.path, hashOne(f.content)])),
    installedAt: new Date().toISOString(),
  };
  await writeFile(
    path.join(skillRoot, SIDECAR_FILENAME),
    `${JSON.stringify(sidecar, null, 2)}\n`,
    "utf8",
  );
}

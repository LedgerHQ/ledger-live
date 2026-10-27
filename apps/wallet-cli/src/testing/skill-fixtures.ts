import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashOne, hashSkillFiles } from "../skills/hash";
import { getSkill, SIDECAR_FILENAME } from "../skills/registry";

const SKILL_NAME = "wallet-cli-usage";

type SkillFileOnDisk = { path: string; content: string };

export async function readTrackedFromDisk(skillRoot: string): Promise<SkillFileOnDisk[]> {
  const skill = getSkill(SKILL_NAME)!;
  return Promise.all(
    skill.files.map(async f => ({
      path: f.path,
      content: await readFile(path.join(skillRoot, f.path), "utf8"),
    })),
  );
}

/** Rewrite the sidecar as if `cliVersion` had installed `files` (default: the shipped files as on disk). */
export async function stampSidecar(
  skillRoot: string,
  cliVersion: string,
  files?: SkillFileOnDisk[],
): Promise<void> {
  const installedFiles = files ?? (await readTrackedFromDisk(skillRoot));
  const sidecar = {
    name: SKILL_NAME,
    cliVersion,
    contentHash: hashSkillFiles(installedFiles),
    files: Object.fromEntries(installedFiles.map(f => [f.path, hashOne(f.content)])),
    installedAt: new Date().toISOString(),
  };
  await writeFile(
    path.join(skillRoot, SIDECAR_FILENAME),
    `${JSON.stringify(sidecar, null, 2)}\n`,
    "utf8",
  );
}

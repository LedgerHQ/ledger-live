// Runtime helpers over the generated skill manifest (see manifest.gen.ts).
// Content is inlined into the binary at build time, so these helpers work
// identically in dev, tests, and the compiled standalone binary.

import { mkdir, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SKILLS, type SkillFile, type SkillManifest } from "./manifest.gen";

export type { SkillFile, SkillManifest };

/** Where each supported agent expects skills, relative to the install root. */
const AGENT_DIRS = {
  claude: ".claude/skills",
  cursor: ".cursor/skills",
  codex: ".codex/skills",
  agents: ".agents/skills",
} as const;

export type SupportedAgent = keyof typeof AGENT_DIRS;

export const SUPPORTED_AGENTS = Object.keys(AGENT_DIRS) as SupportedAgent[];

export const DEFAULT_AGENT: SupportedAgent = "claude";

/** Summary list of every embedded skill. */
export function listSkills(): { name: string; description: string }[] {
  return SKILLS.map(({ name, description }) => ({ name, description }));
}

/** Every embedded skill manifest (used by `skill install --all`). */
export function getAllSkills(): SkillManifest[] {
  return SKILLS;
}

/** Look up a skill by exact name. */
export function getSkill(name: string): SkillManifest | undefined {
  return SKILLS.find(skill => skill.name === name);
}

/** True when exactly one skill is embedded (lets `retrieve`/`install` default it). */
export function getSoleSkill(): SkillManifest | undefined {
  return SKILLS.length === 1 ? SKILLS[0] : undefined;
}

/**
 * Return the content of one file within a skill (default: SKILL.md).
 * Throws if the requested file does not exist.
 */
export function renderSkillMarkdown(skill: SkillManifest, file = "SKILL.md"): string {
  // Normalize to POSIX so a Windows `--file references\foo.md` matches the manifest.
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "");
  const match = skill.files.find(f => f.path === normalized);
  if (!match) {
    const available = skill.files.map(f => f.path).join(", ");
    throw new Error(
      `File "${file}" not found in skill "${skill.name}". Available files: ${available}.`,
    );
  }
  return match.content;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write every file of `skill` under `destRoot/<name>/<relativePath>`.
 * Creates parent directories as needed. Returns the absolute written paths.
 * Refuses to overwrite existing files unless `force` is set.
 */
export async function writeSkill(
  skill: SkillManifest,
  destRoot: string,
  { force = false }: { force?: boolean } = {},
): Promise<string[]> {
  const skillRoot = path.join(destRoot, skill.name);

  // Defense in depth: file paths come from our own generated manifest, but since
  // this writes to disk from data embedded in a published binary, refuse any
  // path that would escape the skill directory (absolute or `..` segments).
  const rootPrefix = path.resolve(skillRoot) + path.sep;
  for (const file of skill.files) {
    const resolved = path.resolve(skillRoot, file.path);
    if (resolved !== path.resolve(skillRoot) && !resolved.startsWith(rootPrefix)) {
      throw new Error(
        `Refusing to write "${file.path}" outside the skill directory "${skillRoot}".`,
      );
    }
  }

  if (!force) {
    const clashes: string[] = [];
    for (const file of skill.files) {
      const target = path.join(skillRoot, file.path);
      if (await pathExists(target)) clashes.push(target);
    }
    if (clashes.length > 0) {
      throw new Error(
        `Refusing to overwrite existing file(s):\n  ${clashes.join("\n  ")}\nRe-run with --force to overwrite.`,
      );
    }
  }

  const written: string[] = [];
  for (const file of skill.files) {
    const target = path.join(skillRoot, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content, "utf8");
    written.push(target);
  }
  return written;
}

export type ResolveInstallRootOptions = {
  agent?: string;
  global?: boolean;
  dir?: string;
};

/**
 * Resolve the directory skills are installed into.
 * - `dir` overrides everything (used verbatim, resolved to absolute).
 * - otherwise map the agent to its skills subdir under the base:
 *     base = `global` ? os.homedir() : process.cwd().
 * Throws for an unknown agent, listing the supported values.
 */
export function resolveInstallRoot({ agent, global, dir }: ResolveInstallRootOptions): string {
  if (dir) {
    return path.resolve(dir);
  }

  const agentName = agent ?? DEFAULT_AGENT;
  // Own-property check, not truthiness: prototype keys ("__proto__", "constructor")
  // index to truthy inherited values and would otherwise bypass this guard.
  if (!Object.hasOwn(AGENT_DIRS, agentName)) {
    throw new Error(
      `Unknown agent "${agent}". Supported agents: ${SUPPORTED_AGENTS.join(", ")}. Or pass --dir <path> to choose an explicit destination.`,
    );
  }
  const subdir = AGENT_DIRS[agentName as SupportedAgent];

  const base = global ? os.homedir() : process.cwd();
  return path.join(base, subdir);
}

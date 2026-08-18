// Runtime helpers over the generated skill manifest (see manifest.gen.ts).
// Content is inlined into the binary at build time, so these helpers work
// identically in dev, tests, and the compiled standalone binary.

import { mkdir, readFile, writeFile, access, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CLI_VERSION, SKILLS, type SkillFile, type SkillManifest } from "./manifest.gen";
import { hashOne, hashSkillFiles } from "./hash";

export type { SkillFile, SkillManifest };
export { CLI_VERSION };

/** Where each supported agent expects skills, relative to the install root. */
export const AGENT_DIRS = {
  claude: ".claude/skills",
  cursor: ".cursor/skills",
  codex: ".codex/skills",
  agents: ".agents/skills",
} as const;

export type SupportedAgent = keyof typeof AGENT_DIRS;

export const SUPPORTED_AGENTS = Object.keys(AGENT_DIRS) as SupportedAgent[];

export const DEFAULT_AGENT: SupportedAgent = "claude";

/**
 * Provenance file written next to each installed skill. It records the state at
 * install time so `skill doctor` can detect drift (outdated binary vs disk, or
 * local edits) without touching the human-readable SKILL.md. It survives
 * `--force` (always rewritten on install) and is never part of a clash check.
 */
export const SIDECAR_FILENAME = ".wallet-cli-skill.json";

export type Sidecar = {
  name: string;
  /** wallet-cli version that installed the skill. */
  cliVersion: string;
  /** Canonical hash of the skill's files at install time. */
  contentHash: string;
  /** Per-file content hash at install time, keyed by posix path. */
  files: Record<string, string>;
  installedAt: string;
};

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

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
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

  // Always (re)write the sidecar — even under --force — so provenance stays
  // fresh. It is excluded from the clash check above, so it never blocks a
  // first install.
  await writeSidecar(skillRoot, skill);

  return written;
}

/** Absolute path to a skill's sidecar file. */
export function sidecarPath(skillRoot: string): string {
  return path.join(skillRoot, SIDECAR_FILENAME);
}

/** Write the provenance sidecar for a freshly (re)installed skill. */
async function writeSidecar(skillRoot: string, skill: SkillManifest): Promise<void> {
  const sidecar: Sidecar = {
    name: skill.name,
    cliVersion: CLI_VERSION,
    contentHash: skill.contentHash,
    files: Object.fromEntries(skill.files.map(f => [f.path, hashOne(f.content)])),
    installedAt: new Date().toISOString(),
  };
  await mkdir(skillRoot, { recursive: true });
  await writeFile(sidecarPath(skillRoot), `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
}

/** Read and parse a skill's sidecar, or undefined if absent/unparseable. */
export async function readSidecar(skillRoot: string): Promise<Sidecar | undefined> {
  try {
    const raw = await readFile(sidecarPath(skillRoot), "utf8");
    return JSON.parse(raw) as Sidecar;
  } catch {
    return undefined;
  }
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

// ---------------------------------------------------------------------------
// Drift diagnosis (used by `skill doctor`)
// ---------------------------------------------------------------------------

export type DiagnosisStatus = "up-to-date" | "outdated" | "modified-locally" | "missing";

export type SkillDiagnosis = {
  name: string;
  /** Scan root this diagnosis was produced under. */
  root: string;
  /** `<root>/<name>` — where the skill lives (or would live for `missing`). */
  skillRoot: string;
  status: DiagnosisStatus;
  /** Version recorded in the sidecar at install time (if any). */
  installedVersion?: string;
  /** Canonical hash recorded in the sidecar at install time (if any). */
  installedHash?: string;
  /** Canonical hash recomputed over the tracked files on disk (if present). */
  diskHash?: string;
  shippedVersion: string;
  shippedHash: string;
};

export type ScanOptions = {
  global?: boolean;
  dir?: string;
};

/**
 * Resolve the directories `doctor` scans for installed skills.
 * - `dir` → just that directory.
 * - otherwise every agent skills dir under process.cwd(), plus the same under
 *   os.homedir() when `global`.
 */
export function resolveScanRoots({ global, dir }: ScanOptions): string[] {
  if (dir) {
    return [path.resolve(dir)];
  }
  const bases = global ? [process.cwd(), os.homedir()] : [process.cwd()];
  // De-duplicate while preserving order: with --global, process.cwd() can equal
  // os.homedir() (running from home), which would otherwise scan — and --fix — the
  // same roots twice.
  const seen = new Set<string>();
  const roots: string[] = [];
  for (const base of bases) {
    for (const subdir of Object.values(AGENT_DIRS)) {
      const root = path.join(base, subdir);
      if (!seen.has(root)) {
        seen.add(root);
        roots.push(root);
      }
    }
  }
  return roots;
}

/**
 * Diagnose one shipped `skill` at `root` (which must contain `<root>/<name>`).
 * Recomputes the disk hash over the manifest-tracked files and classifies the
 * install:
 * - No sidecar (legacy/manual install): `up-to-date` if the disk hash matches
 *   what this binary ships, otherwise `modified-locally` — without provenance we
 *   can't tell an old version from local edits, so we don't let `--fix` overwrite
 *   it unless the caller also passes `--force`.
 * - Sidecar present: disk hash disagrees with the sidecar → `modified-locally`;
 *   else sidecar matches the shipped hash → `up-to-date`; else → `outdated`.
 */
export async function diagnoseSkill(skill: SkillManifest, root: string): Promise<SkillDiagnosis> {
  const skillRoot = path.join(root, skill.name);
  const sidecar = await readSidecar(skillRoot);

  const onDisk: { path: string; content: string }[] = [];
  for (const file of skill.files) {
    try {
      const content = await readFile(path.join(skillRoot, file.path), "utf8");
      onDisk.push({ path: file.path, content });
    } catch {
      // Tracked file missing on disk — counts as local modification (hash drifts).
    }
  }
  const diskHash = hashSkillFiles(onDisk);

  let status: DiagnosisStatus;
  if (!sidecar) {
    status = diskHash === skill.contentHash ? "up-to-date" : "modified-locally";
  } else if (diskHash !== sidecar.contentHash) {
    status = "modified-locally";
  } else if (sidecar.contentHash === skill.contentHash) {
    status = "up-to-date";
  } else {
    status = "outdated";
  }

  return {
    name: skill.name,
    root,
    skillRoot,
    status,
    installedVersion: sidecar?.cliVersion,
    installedHash: sidecar?.contentHash,
    diskHash,
    shippedVersion: CLI_VERSION,
    shippedHash: skill.contentHash,
  };
}

/**
 * Scan the resolved roots for every shipped skill. Produces one diagnosis per
 * (root, skill) where the skill directory exists, plus a single `missing`
 * diagnosis for any shipped skill found in no scanned root (targeting the first
 * root so `--fix` has a concrete destination).
 */
export async function scanInstalledSkills(options: ScanOptions): Promise<SkillDiagnosis[]> {
  const roots = resolveScanRoots(options);
  const results: SkillDiagnosis[] = [];

  for (const skill of SKILLS) {
    let foundAnywhere = false;
    for (const root of roots) {
      const skillRoot = path.join(root, skill.name);
      // A regular file at this path is not an installed skill; `pathExists`
      // (access-based) would treat it as one, so require an actual directory.
      if (!(await isDirectory(skillRoot))) continue;
      foundAnywhere = true;
      results.push(await diagnoseSkill(skill, root));
    }
    if (!foundAnywhere) {
      const root = roots[0] ?? process.cwd();
      results.push({
        name: skill.name,
        root,
        skillRoot: path.join(root, skill.name),
        status: "missing",
        shippedVersion: CLI_VERSION,
        shippedHash: skill.contentHash,
      });
    }
  }

  return results;
}

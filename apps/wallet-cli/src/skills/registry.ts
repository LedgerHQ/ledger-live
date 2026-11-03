// Runtime helpers over the generated skill manifest (see manifest.gen.ts).
// Content is inlined into the binary at build time, so these helpers work
// identically in dev, tests, and the compiled standalone binary.

import { mkdir, readFile, writeFile, lstat, realpath, stat, unlink } from "node:fs/promises";
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

/**
 * Names older wallet-cli versions shipped, mapped to the name shipped today.
 *
 * The embedded skill was renamed `ledger-wallet-cli` -> `wallet-cli-usage` so the
 * binary, the copy published to LedgerHQ/agent-skills and the skill's own
 * frontmatter agree. `wallet-cli skill retrieve ledger-wallet-cli` was documented
 * in the README and is baked into the context of agents that already read the old
 * skill, so it has to keep working.
 *
 * Aliases resolve on lookup ONLY. `listSkills()` never surfaces them, and
 * `writeSkill`/`writeSidecar` key off `skill.name`, so a legacy lookup returns the
 * canonical skill and can never materialize a second copy on disk under the old
 * name. A Map (not an object) so `getSkill("__proto__")` can't reach a prototype
 * value — same reasoning as the `Object.hasOwn` guard in `resolveInstallRoot`.
 */
const LEGACY_SKILL_NAMES: ReadonlyMap<string, string> = new Map([
  ["ledger-wallet-cli", "wallet-cli-usage"],
]);

/** Legacy directory names `doctor` should recognize for a canonical skill. */
function legacyNamesFor(canonicalName: string): string[] {
  return [...LEGACY_SKILL_NAMES.entries()]
    .filter(([, canonical]) => canonical === canonicalName)
    .map(([legacy]) => legacy);
}

/**
 * Summary list of every embedded skill. Canonical names only — legacy aliases are
 * deliberately absent so `skill list` shows one entry per skill, not a duplicate
 * pair pointing at the same content.
 */
export function listSkills(): { name: string; description: string }[] {
  return SKILLS.map(({ name, description }) => ({ name, description }));
}

/** Every embedded skill manifest (used by `skill install --all`). */
export function getAllSkills(): SkillManifest[] {
  return SKILLS;
}

/**
 * Look up a skill by name, accepting the legacy names in `LEGACY_SKILL_NAMES`.
 * Always returns the canonical manifest, so callers that write to disk (`install`,
 * `doctor --fix`) use the canonical name regardless of what the user typed.
 */
export function getSkill(name: string): SkillManifest | undefined {
  const canonicalName = LEGACY_SKILL_NAMES.get(name) ?? name;
  return SKILLS.find(skill => skill.name === canonicalName);
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

async function holdsAnything(p: string): Promise<boolean> {
  try {
    await lstat(p);
    return true;
  } catch (e) {
    return (e as { code?: string } | null)?.code !== "ENOENT";
  }
}

async function isSymlink(p: string): Promise<boolean> {
  try {
    return (await lstat(p)).isSymbolicLink();
  } catch {
    return false;
  }
}

async function writeFileReplacingLink(target: string, content: string): Promise<void> {
  if (await isSymlink(target)) await unlink(target);
  await writeFile(target, content, "utf8");
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

function isWithinSkillDir(skillRoot: string, filePath: string): boolean {
  const root = path.resolve(skillRoot);
  const resolved = path.resolve(root, filePath);
  return resolved === root || resolved.startsWith(root + path.sep);
}

async function resolvesInsideSkillDir(skillRoot: string, target: string): Promise<boolean> {
  try {
    const [realRoot, realParent] = await Promise.all([
      realpath(skillRoot),
      realpath(path.dirname(target)),
    ]);
    return isWithinSkillDir(realRoot, realParent);
  } catch {
    return false;
  }
}

async function isUneditedFile(p: string, recordedHash: string): Promise<boolean> {
  try {
    if (!(await lstat(p)).isFile()) return false;
    return hashOne(await readFile(p, "utf8")) === recordedHash;
  } catch {
    return false;
  }
}

async function removeDroppedFiles(skillRoot: string, skill: SkillManifest): Promise<void> {
  const previous = await readSidecar(skillRoot);
  const shipped = new Set(skill.files.map(f => f.path));
  const dropped = Object.entries(previous?.files ?? {}).filter(
    ([filePath]) => !shipped.has(filePath) && isWithinSkillDir(skillRoot, filePath),
  );
  await Promise.all(
    dropped.map(async ([filePath, recordedHash]) => {
      const target = path.resolve(skillRoot, filePath);
      const deletable =
        (await resolvesInsideSkillDir(skillRoot, target)) &&
        (await isUneditedFile(target, recordedHash));
      if (deletable) await unlink(target).catch(() => undefined);
    }),
  );
}

/**
 * Write every file of `skill` under `destRoot/<name>/<relativePath>`.
 * Creates parent directories as needed. Returns the absolute written paths.
 * Refuses to overwrite existing files unless `force` is set. Deletes the unedited
 * files the previous install recorded that `skill` no longer ships.
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
  for (const file of skill.files) {
    if (!isWithinSkillDir(skillRoot, file.path)) {
      throw new Error(
        `Refusing to write "${file.path}" outside the skill directory "${skillRoot}".`,
      );
    }
  }

  if (!force) {
    const targets = skill.files.map(file => path.join(skillRoot, file.path));
    const taken = await Promise.all(targets.map(holdsAnything));
    const clashes = targets.filter((_, i) => taken[i]);
    if (clashes.length > 0) {
      throw new Error(
        `Refusing to overwrite existing file(s):\n  ${clashes.join("\n  ")}\nRe-run with --force to overwrite.`,
      );
    }
  }

  // Before the writes: on a case-insensitive disk a dropped path can name a shipped file.
  await removeDroppedFiles(skillRoot, skill);

  const written = await Promise.all(
    skill.files.map(async file => {
      const target = path.join(skillRoot, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFileReplacingLink(target, file.content);
      return target;
    }),
  );

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
  await writeFileReplacingLink(sidecarPath(skillRoot), `${JSON.stringify(sidecar, null, 2)}\n`);
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
  /**
   * Directories under `root` holding an install of this skill under a name it no
   * longer uses (see `LEGACY_SKILL_NAMES`), as attested by their sidecar. Reported
   * so a pre-rename install is visible rather than silently orphaned; never
   * written to or deleted.
   */
  supersededRoots?: string[];
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

async function readTrackedFile(
  skillRoot: string,
  filePath: string,
): Promise<{ path: string; content: string } | undefined> {
  const target = path.join(skillRoot, filePath);
  try {
    if (!(await lstat(target)).isFile() || !(await resolvesInsideSkillDir(skillRoot, target))) {
      return undefined;
    }
    return { path: filePath, content: await readFile(target, "utf8") };
  } catch {
    // Tracked file missing on disk — counts as local modification (hash drifts).
    return undefined;
  }
}

async function differsOnDisk(skillRoot: string, file: SkillFile): Promise<boolean> {
  const target = path.join(skillRoot, file.path);
  if (!(await holdsAnything(target))) {
    return (
      (await holdsAnything(path.dirname(target))) &&
      !(await resolvesInsideSkillDir(skillRoot, target))
    );
  }
  return (await readTrackedFile(skillRoot, file.path))?.content !== file.content;
}

async function changedSinceInstall(
  skillRoot: string,
  skill: SkillManifest,
  recordedFiles: Record<string, string>,
): Promise<string[]> {
  const recorded = await Promise.all(
    Object.entries(recordedFiles).map(async ([filePath, recordedHash]) => {
      const onDisk = await readTrackedFile(skillRoot, filePath);
      return onDisk && hashOne(onDisk.content) === recordedHash ? undefined : filePath;
    }),
  );
  const newlyShipped = skill.files.filter(f => !Object.hasOwn(recordedFiles, f.path));
  const taken = await Promise.all(
    newlyShipped.map(async file =>
      (await differsOnDisk(skillRoot, file)) ? file.path : undefined,
    ),
  );
  return [...recorded, ...taken]
    .filter(filePath => filePath !== undefined)
    .map(filePath => path.join(skillRoot, filePath));
}

export async function findChangedFiles(skill: SkillManifest, root: string): Promise<string[]> {
  const skillRoot = path.join(root, skill.name);
  const sidecar = await readSidecar(skillRoot);
  return sidecar ? changedSinceInstall(skillRoot, skill, sidecar.files) : [];
}

/**
 * Diagnose one shipped `skill` at `root` (which must contain `<root>/<name>`).
 * Recomputes the disk hash over the files the sidecar recorded (so a file a newer
 * skill dropped still counts), or over the manifest's files without a sidecar,
 * and classifies the install:
 * - No sidecar (legacy/manual install): `up-to-date` if the disk hash matches
 *   what this binary ships, otherwise `modified-locally` — without provenance we
 *   can't tell an old version from local edits, so we don't let `--fix` overwrite
 *   it unless the caller also passes `--force`.
 * - Sidecar present: disk hash disagrees with the sidecar, or a path the sidecar
 *   didn't record already holds anything but the shipped file →
 *   `modified-locally`; else sidecar matches the shipped hash → `up-to-date`;
 *   else → `outdated`.
 */
export async function diagnoseSkill(skill: SkillManifest, root: string): Promise<SkillDiagnosis> {
  const skillRoot = path.join(root, skill.name);
  const sidecar = await readSidecar(skillRoot);
  const recordedFiles = sidecar?.files ?? {};

  const trackedPaths = sidecar ? Object.keys(recordedFiles) : skill.files.map(f => f.path);
  const onDisk = (
    await Promise.all(trackedPaths.map(filePath => readTrackedFile(skillRoot, filePath)))
  ).filter(file => file !== undefined);
  const diskHash = hashSkillFiles(onDisk);

  const changedFiles = sidecar ? await changedSinceInstall(skillRoot, skill, recordedFiles) : [];

  let status: DiagnosisStatus;
  if (!sidecar) {
    status = diskHash === skill.contentHash ? "up-to-date" : "modified-locally";
  } else if (diskHash !== sidecar.contentHash || changedFiles.length > 0) {
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
 * Find installs of `skill` under `root` under a name it no longer ships.
 *
 * Identified by provenance, not directory name: the sidecar must record that
 * legacy name. So the canonical source at `.agents/skills/ledger-wallet-cli` (a
 * scanned root) isn't reported as a stale install of itself, and an unrelated
 * directory can't be reported or decide where `--fix` installs.
 */
async function findSupersededRoots(skill: SkillManifest, root: string): Promise<string[]> {
  const found: string[] = [];
  for (const legacyName of legacyNamesFor(skill.name)) {
    const legacyRoot = path.join(root, legacyName);
    if (!(await isDirectory(legacyRoot))) continue;
    const sidecar = await readSidecar(legacyRoot);
    if (sidecar?.name !== legacyName) continue;
    found.push(legacyRoot);
  }
  return found;
}

/**
 * Scan the resolved roots for every shipped skill. Produces one diagnosis per
 * (root, skill) where the skill directory exists — or where only a pre-rename
 * install of it does, so `--fix` installs the canonical skill there rather than
 * leaving the old copy as the only one on disk — plus a single `missing` diagnosis
 * for any shipped skill found in no scanned root (targeting the first root so
 * `--fix` has a concrete destination).
 */
export async function scanInstalledSkills(options: ScanOptions): Promise<SkillDiagnosis[]> {
  const roots = resolveScanRoots(options);
  const results: SkillDiagnosis[] = [];

  for (const skill of SKILLS) {
    let foundAnywhere = false;
    for (const root of roots) {
      const supersededRoots = await findSupersededRoots(skill, root);
      const skillRoot = path.join(root, skill.name);
      if (await isDirectory(skillRoot)) {
        foundAnywhere = true;
        const diagnosis = await diagnoseSkill(skill, root);
        results.push(supersededRoots.length > 0 ? { ...diagnosis, supersededRoots } : diagnosis);
      } else if (supersededRoots.length > 0) {
        // Only a pre-rename install here. Report `missing` at this root (not the
        // fallback root below) so `--fix` heals the user's actual install location.
        foundAnywhere = true;
        results.push({
          name: skill.name,
          root,
          skillRoot,
          status: "missing",
          supersededRoots,
          shippedVersion: CLI_VERSION,
          shippedHash: skill.contentHash,
        });
      }
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

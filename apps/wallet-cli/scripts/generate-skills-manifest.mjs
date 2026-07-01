// Embeds the Ledger agent skills into a TypeScript manifest so
// `wallet-cli skill list | retrieve | install` works from the compiled Bun
// binary with zero loose runtime files.
//
// Content is inlined as string literals (not `with { type: "file" }`) so it
// behaves identically in `bun run` (dev/tests) and in the standalone binary.
//
// The generated file (src/skills/manifest.gen.ts) is NOT committed — it is
// gitignored (same convention as .bunli/commands.gen.ts) and regenerated before
// typecheck / test / build via the pre* npm scripts.
//
// Usage:
//   node ./scripts/generate-skills-manifest.mjs          # (re)write the manifest
//   node ./scripts/generate-skills-manifest.mjs --check   # validate generation succeeds (no write)

import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Read skills directly from their canonical home, `.agents/skills/`. (`.claude/skills`
// is just a symlink to it.) Reading the real tree means we don't have to resolve any
// top-level symlink; the only symlinks left are in-repo `references/safety.md` files
// that point to a shared copy within this same tree, which `readFile` follows natively.
const skillsSourceDir = path.resolve(root, "../../.agents/skills");
const outFile = path.resolve(root, "src/skills/manifest.gen.ts");

// Symlink-resolved skills root, used as the boundary for the guard in collectFiles.
// (Resolved so a symlinked parent — e.g. a git worktree path — compares correctly.)
const skillsSourceDirReal = await realpath(skillsSourceDir).catch(() => skillsSourceDir);

const CHECK = process.argv.includes("--check");

// Only these skills ship inside the published wallet-cli binary. The source
// directories hold ~40 internal repo dev/process skills (CI, e2e, MVVM, release
// tooling…) that must not leak into a public npm package. The collection
// machinery below is fully generic, so shipping another skill is a one-line
// addition here.
const SHIPPED_SKILLS = new Set(["ledger-wallet-cli"]);

/**
 * Recursively collect files (relative paths) under `dir`. Uses `lstat` so symlinks
 * are not transparently followed: symlinked files (e.g. `references/safety.md` →
 * shared copy) are included as leaves after checking they resolve inside the skills
 * tree, and symlinked directories are never descended into — so a stray symlink can't
 * pull arbitrary files into the published binary.
 */
async function collectFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const info = await lstat(abs);
    if (info.isSymbolicLink()) {
      const real = await realpath(abs);
      if (real !== skillsSourceDirReal && !real.startsWith(skillsSourceDirReal + path.sep)) {
        throw new Error(
          `Refusing to embed "${path.relative(root, abs)}": symlink resolves outside the skills tree (${real}).`,
        );
      }
      files.push(path.relative(base, abs));
    } else if (info.isDirectory()) {
      files.push(...(await collectFiles(abs, base)));
    } else if (info.isFile()) {
      files.push(path.relative(base, abs));
    }
  }
  return files;
}

/**
 * Read a skill file's content. We read the real local file directly — `readFile`
 * follows the in-repo `references/safety.md` symlinks natively, and collectFiles has
 * already rejected any symlink resolving outside the skills tree — so there's no need
 * to resolve canonical paths here.
 */
async function readSkillFile(filePath) {
  return readFile(filePath, "utf8");
}

// Canonical content hashing — keep in sync with src/skills/hash.ts. The codegen
// .mjs cannot import the .ts helper, so the identical algorithm is replicated
// here: sha256 over sorted `path + "\0" + sha256(content) + "\n"`. Runtime
// trusts the manifest's shippedHash, so the two only need to agree so a clean
// fresh install classifies as up-to-date.
function hashOne(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function hashSkillFiles(files) {
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const combined = createHash("sha256");
  for (const file of sorted) {
    combined.update(`${file.path}\0${hashOne(file.content)}\n`, "utf8");
  }
  return combined.digest("hex");
}

/** Extract the `description:` field from a SKILL.md YAML frontmatter block. */
function parseDescription(skillMd) {
  // Tolerate CRLF checkouts (Windows core.autocrlf) so the frontmatter regex matches.
  const frontmatter = skillMd.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return "";
  const line = frontmatter[1].match(/^description:\s*(.*)$/m);
  if (!line) return "";
  return line[1].trim().replace(/^["']|["']$/g, "");
}

/** Order files with SKILL.md first, then the rest alphabetically (posix). */
function orderFiles(files) {
  return [...files].sort((a, b) => {
    if (a === "SKILL.md") return -1;
    if (b === "SKILL.md") return 1;
    return a.localeCompare(b);
  });
}

async function buildManifest() {
  let dirEntries;
  try {
    dirEntries = await readdir(skillsSourceDir, { withFileTypes: true });
  } catch {
    throw new Error(`Skills source directory not found: ${skillsSourceDir}`);
  }

  const skills = [];
  for (const entry of dirEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    // Use the Dirent's isDirectory() (does NOT follow symlinks) so a symlinked
    // entry can't be treated as a real skill dir and bypass collectFiles' guard.
    if (!entry.isDirectory()) continue;
    if (!SHIPPED_SKILLS.has(entry.name)) continue;

    const skillDir = path.join(skillsSourceDir, entry.name);
    const skillMdPath = path.join(skillDir, "SKILL.md");
    let skillMd;
    try {
      skillMd = await readSkillFile(skillMdPath);
    } catch {
      // Not a skill directory (no SKILL.md) — skip so this scales to N skills.
      continue;
    }

    const relFiles = orderFiles(await collectFiles(skillDir));
    const files = [];
    for (const rel of relFiles) {
      // Normalize to posix so the generated manifest is stable across OSes.
      const posixRel = rel.split(path.sep).join("/");
      const content = await readSkillFile(path.join(skillDir, rel));
      files.push({ path: posixRel, content });
    }

    skills.push({
      name: entry.name,
      description: parseDescription(skillMd),
      contentHash: hashSkillFiles(files),
      files,
    });
  }

  return skills;
}

/** Read this package's version so the manifest can version-lock installs. */
async function readCliVersion() {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  return pkg.version;
}

function render(skills, cliVersion) {
  const header = `// This file is generated by scripts/generate-skills-manifest.mjs.
// Do NOT edit by hand — run \`pnpm generate:skills\` to regenerate.
// It is gitignored and regenerated before typecheck / test / build.
//
// Skill content from .agents/skills/* is inlined as string literals so it is
// embedded into the compiled Bun binary and works identically in dev and tests.

export type SkillFile = {
  /** Path relative to the skill directory, e.g. "SKILL.md" or "references/business-logic.md". */
  path: string;
  content: string;
};

export type SkillManifest = {
  name: string;
  description: string;
  /** Canonical sha256 over this skill's files (see src/skills/hash.ts). */
  contentHash: string;
  files: SkillFile[];
};

/** wallet-cli version this manifest was generated from (version-locks installs). */
export const CLI_VERSION = ${JSON.stringify(cliVersion)};

`;

  const body = skills
    .map(skill => {
      const files = skill.files
        .map(
          file =>
            `      { path: ${JSON.stringify(file.path)}, content: ${JSON.stringify(file.content)} },`,
        )
        .join("\n");
      return `  {
    name: ${JSON.stringify(skill.name)},
    description: ${JSON.stringify(skill.description)},
    contentHash: ${JSON.stringify(skill.contentHash)},
    files: [
${files}
    ],
  },`;
    })
    .join("\n");

  return `${header}export const SKILLS: SkillManifest[] = [
${body}
];
`;
}

const skills = await buildManifest();
const cliVersion = await readCliVersion();
const output = render(skills, cliVersion);
const total = skills.reduce((n, s) => n + s.files.length, 0);

// Every shipped skill must be found in the sources with a SKILL.md. Enforce this
// in BOTH modes: otherwise a renamed/missing skill would silently produce a
// binary with skills missing, and only an explicit `--check` run would catch it.
const found = new Set(skills.map(s => s.name));
const missing = [...SHIPPED_SKILLS].filter(name => !found.has(name));
if (missing.length > 0) {
  console.error(
    `Skill generation failed — shipped skill(s) not found in sources: ${missing.join(", ")}.`,
  );
  console.error(`Searched: ${skillsSourceDir}`);
  process.exit(1);
}

if (CHECK) {
  // The manifest is gitignored (regenerated on demand), so a "stale vs committed
  // file" check is not meaningful — the validation above is the meaningful part.
  console.log(`Skill generation OK (${skills.length} skill(s), ${total} file(s)).`);
} else {
  await writeFile(outFile, output, "utf8");
  console.log(
    `Wrote ${path.relative(root, outFile)} (${skills.length} skill(s), ${total} file(s)).`,
  );
}

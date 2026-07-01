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

import { readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Skills are discovered under `.claude/skills/`. Note that in this repo
// `.claude/skills/` (and/or individual skill files) may be symlinks whose
// canonical ("main") copy lives under `.agents/skills/`. We resolve symlinks to
// their real path when reading contents (see `readSkillFile`) so the canonical
// file is embedded — while still discovering everything through `.claude/skills/`.
const skillsSourceDir = path.resolve(root, "../../.claude/skills");
const outFile = path.resolve(root, "src/skills/manifest.gen.ts");

const CHECK = process.argv.includes("--check");

// Only these skills ship inside the published wallet-cli binary. The source
// directories hold ~40 internal repo dev/process skills (CI, e2e, MVVM, release
// tooling…) that must not leak into a public npm package. The collection
// machinery below is fully generic, so shipping another skill is a one-line
// addition here.
const SHIPPED_SKILLS = new Set(["ledger-wallet-cli"]);

/**
 * Recursively collect files (relative paths) under `dir`. Symlinked entries are
 * followed (via stat on the resolved target) so a symlinked file or subdir is
 * still picked up; plain files/dirs work unchanged.
 */
async function collectFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    // `stat` follows symlinks, so this classifies symlink targets correctly too.
    const info = await stat(abs);
    if (info.isDirectory()) {
      files.push(...(await collectFiles(abs, base)));
    } else if (info.isFile()) {
      files.push(path.relative(base, abs));
    }
  }
  return files;
}

/**
 * Read a file's content by its canonical path, resolving symlinks first so the
 * real ("main") file is embedded rather than a symlink. Falls back to the given
 * path when it is a plain (non-symlinked) file/dir.
 */
async function readSkillFile(filePath) {
  let realPath = filePath;
  try {
    realPath = await realpath(filePath);
  } catch {
    // Path cannot be resolved (should not happen for an existing file) — read as-is.
  }
  return readFile(realPath, "utf8");
}

/** Extract the `description:` field from a SKILL.md YAML frontmatter block. */
function parseDescription(skillMd) {
  const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/);
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
    // `entry` may be a symlink to a dir; classify via stat on the resolved target.
    const entryPath = path.join(skillsSourceDir, entry.name);
    const entryInfo = await stat(entryPath);
    if (!entryInfo.isDirectory()) continue;
    if (!SHIPPED_SKILLS.has(entry.name)) continue;

    const skillDir = entryPath;
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
      // Resolve symlinks so the canonical ("main") file content is embedded.
      const content = await readSkillFile(path.join(skillDir, rel));
      files.push({ path: posixRel, content });
    }

    skills.push({
      name: entry.name,
      description: parseDescription(skillMd),
      files,
    });
  }

  return skills;
}

function render(skills) {
  const header = `// This file is generated by scripts/generate-skills-manifest.mjs.
// Do NOT edit by hand — run \`pnpm generate:skills\` to regenerate.
// It is gitignored and regenerated before typecheck / test / build.
//
// Skill content from .claude/skills/* (symlinks resolved to the canonical file)
// is inlined as string literals so it is embedded into the compiled Bun binary
// and works identically in dev and tests.

export type SkillFile = {
  /** Path relative to the skill directory, e.g. "SKILL.md" or "references/business-logic.md". */
  path: string;
  content: string;
};

export type SkillManifest = {
  name: string;
  description: string;
  files: SkillFile[];
};

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
const output = render(skills);
const total = skills.reduce((n, s) => n + s.files.length, 0);

if (CHECK) {
  // The manifest is gitignored (regenerated on demand), so a "stale vs committed
  // file" check is not meaningful. Instead, validate that generation succeeds:
  // every shipped skill must be found in the sources with a SKILL.md.
  const found = new Set(skills.map(s => s.name));
  const missing = [...SHIPPED_SKILLS].filter(name => !found.has(name));
  if (missing.length > 0) {
    console.error(
      `Skill generation failed — shipped skill(s) not found in sources: ${missing.join(", ")}.`,
    );
    console.error(`Searched: ${skillsSourceDir}`);
    process.exit(1);
  }
  console.log(`Skill generation OK (${skills.length} skill(s), ${total} file(s)).`);
} else {
  await writeFile(outFile, output, "utf8");
  console.log(
    `Wrote ${path.relative(root, outFile)} (${skills.length} skill(s), ${total} file(s)).`,
  );
}

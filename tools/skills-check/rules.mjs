import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, posix, relative, sep } from "node:path";

export const LAYERS = ["support", "shared", "domain", "features", "devtools"];
const LAYERS_WITH_CATEGORY_READMES = ["domain", "features"];
const CURSOR_KEYS = new Set(["globs", "alwaysApply", "model", "is_background"]);
const IGNORED_DIRS = new Set([".git", "node_modules"]);
// Also a package subfolder in most packages, so `tests/setup.ts` usually means a package's own.
const PACKAGE_RELATIVE_FOLDERS = new Set(["e2e", "scripts", "tests"]);

const KEY_LINE = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const CODE_SPAN = /(`+)(.+?)\1(?!`)/g;
const INLINE_LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const REFERENCE_LINK = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const PLAIN_PATH = /^[\w.@+-]+(?:\/[\w.@+-]+)*\/?$/;
// Sentence ends at a period followed by a space or the end, so `Set.has()` stays in the clause.
const WHEN_CLAUSE = /\b(?:use|read) when\b(?:[^.]|\.(?!\s|$))*(?:\.|$)/i;
const MIN_WHAT_WORDS = 3;

const toPosix = path => path.split(sep).join(posix.sep);

const walkMarkdown = (dir, out) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) walkMarkdown(path, out);
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(path);
  }
  return out;
};

const subdirectories = dir =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => join(dir, entry.name))
    : [];

export const listFiles = root => {
  const files = [
    ...walkMarkdown(join(root, ".agents"), []),
    ...walkMarkdown(join(root, "docs"), []),
  ];
  const readmes = [
    join(root, "AGENTS.md"),
    ...LAYERS.map(layer => join(root, layer, "README.md")),
    ...LAYERS_WITH_CATEGORY_READMES.flatMap(layer =>
      subdirectories(join(root, layer)).map(dir => join(dir, "README.md")),
    ),
  ];
  return [...files, ...readmes.filter(file => existsSync(file))]
    .map(file => toPosix(relative(root, file)))
    .sort();
};

const unquote = value => value.replace(/^(["'])([\s\S]*)\1$/, "$2");

const scalar = ([head, ...more]) => {
  const continuation = more.map(line => line.trim()).filter(Boolean);
  if (/^[|>][-+]?$/.test(head.trim())) return continuation.join(" ");
  return unquote([head.trim(), ...continuation].join(" ").trim());
};

export const parseFrontmatter = text => {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---") return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trimEnd() === "---");
  if (end < 0) return null;

  const raw = new Map();
  const keyLines = new Map();
  let key;
  lines.slice(1, end).forEach((line, i) => {
    const match = KEY_LINE.exec(line);
    if (match) {
      key = match[1];
      raw.set(key, [match[2] ?? ""]);
      keyLines.set(key, i + 2);
    } else if (key) raw.get(key).push(line);
  });

  const next = lines.findIndex((line, i) => i > end && line.trim() !== "");
  const duplicated =
    next > 0 && lines[next].trimEnd() === "---" && KEY_LINE.test(lines[next + 1] ?? "");

  const data = Object.fromEntries([...raw].map(([name, parts]) => [name, scalar(parts)]));
  return { data, keyLines, duplicated, duplicateLine: next + 1 };
};

export const describeProblem = description => {
  const clause = WHEN_CLAUSE.exec(description);
  if (!clause) return 'has no "Use when" or "Read when" clause';
  const what = description
    .replace(WHEN_CLAUSE, " ")
    .split(/\s+/)
    .filter(word => /\w/.test(word));
  if (what.length < MIN_WHAT_WORDS) return "says when to use the skill but not what it does";
  return null;
};

const frontmatterKind = file => {
  const parts = file.split("/");
  if (parts[0] !== ".agents") return null;
  if (parts[1] === "skills" && parts.length === 4 && parts[3] === "SKILL.md")
    return { kind: "skill", expectedName: parts[2], nameSource: "folder" };
  if (parts[1] === "agents" && parts.length === 3)
    return { kind: "agent", expectedName: basename(file, ".md"), nameSource: "file name" };
  return null;
};

const checkFrontmatter = (file, text, report) => {
  const target = frontmatterKind(file);
  if (!target) return;
  const fm = parseFrontmatter(text);
  if (!fm) return report(1, "frontmatter", "has no frontmatter block");
  if (fm.duplicated) report(fm.duplicateLine, "frontmatter", "has more than one frontmatter block");

  const { name, description } = fm.data;
  if (!name) report(1, "frontmatter", "has no `name`");
  else if (name !== target.expectedName)
    report(
      fm.keyLines.get("name"),
      "frontmatter",
      `\`name: ${name}\` differs from the ${target.nameSource} \`${target.expectedName}\``,
    );
  if (!description) report(1, "frontmatter", "has no `description`");

  for (const key of fm.keyLines.keys())
    if (CURSOR_KEYS.has(key))
      report(
        fm.keyLines.get(key),
        "cursor-key",
        `\`${key}\` is a Cursor rule key, not a skill or agent key`,
      );

  if (target.kind === "skill" && description) {
    const problem = describeProblem(description);
    if (problem) report(fm.keyLines.get("description"), "description", `description ${problem}`);
  }
};

const proseLines = text => {
  const out = [];
  let fence = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    } else if (marker) fence = marker;
    else out.push({ line, number: i + 1 });
  });
  return out;
};

const linkTarget = raw => {
  if (URL_SCHEME.test(raw) || raw.startsWith("//") || raw.startsWith("#")) return null;
  const path = raw.replace(/[#?].*$/, "");
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

const pathCandidate = (span, topLevel) => {
  const path = span.trim().replace(/(?::\d+){1,2}$|#L\d+(?:-L\d+)?$/, "");
  if (!PLAIN_PATH.test(path) || !path.includes("/")) return null;
  const segments = path.split("/");
  if (!topLevel.has(segments[0]) || segments.includes("..") || segments.includes("..."))
    return null;
  return path;
};

// Build outputs are gitignored: absent from a fresh checkout without being drift.
const gitIgnored = (root, paths) => {
  if (paths.length === 0) return new Set();
  try {
    const out = execFileSync("git", ["check-ignore", "--no-index", "--stdin"], {
      cwd: root,
      input: paths.join("\n"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return new Set(out.split("\n").filter(Boolean));
  } catch (error) {
    return new Set(error.status === 1 ? [] : (error.stdout ?? "").split("\n").filter(Boolean));
  }
};

const checkReferences = (root, file, text, topLevel, report) => {
  const missingPaths = [];
  for (const { line, number } of proseLines(text)) {
    const spans = [...line.matchAll(CODE_SPAN)].map(match => match[2]);
    for (const span of spans) {
      const path = pathCandidate(span, topLevel);
      if (path && !existsSync(join(root, path))) missingPaths.push({ path, number });
    }

    const prose = line.replace(CODE_SPAN, "");
    const targets = [...prose.matchAll(INLINE_LINK)].map(match => match[1]);
    const reference = REFERENCE_LINK.exec(prose)?.[1];
    if (reference) targets.push(reference);
    for (const raw of targets) {
      const target = linkTarget(raw);
      if (!target) continue;
      const resolved = target.startsWith("/")
        ? join(root, target)
        : join(root, dirname(file), target);
      if (!existsSync(resolved)) report(number, "dead-link", `link to \`${raw}\` does not resolve`);
    }
  }

  const ignored = gitIgnored(root, [...new Set(missingPaths.map(({ path }) => path))]);
  for (const { path, number } of missingPaths)
    if (!ignored.has(path)) report(number, "dead-path", `\`${path}\` does not exist`, path);
};

const topLevelFolders = root =>
  new Set(
    readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !IGNORED_DIRS.has(entry.name))
      .filter(entry => !PACKAGE_RELATIVE_FOLDERS.has(entry.name))
      .map(entry => entry.name),
  );

const isWaived = (waiver, finding) =>
  finding.code === "dead-path" && waiver.file === finding.file && waiver.path === finding.path;

const isComplete = waiver => Boolean(waiver.file && waiver.path && waiver.reason?.trim());

// A waiver needs a reason, and one that no longer matches is reported so the list cannot rot.
export const applyWaivers = (findings, waivers, waiversFile) => {
  const valid = waivers.filter(isComplete);
  const kept = findings.filter(finding => !valid.some(waiver => isWaived(waiver, finding)));
  waivers.forEach((waiver, index) => {
    const entry = `entry ${index + 1} of ${waiversFile}`;
    if (!isComplete(waiver))
      kept.push({
        file: waiversFile,
        line: 1,
        code: "waiver",
        message: `${entry} needs a file, a path and a reason`,
      });
    else if (!findings.some(finding => isWaived(waiver, finding)))
      kept.push({
        file: waiver.file,
        line: 1,
        code: "stale-waiver",
        message: `\`${waiver.path}\` is waived by ${entry} but no longer reported here`,
      });
  });
  return kept;
};

export const checkRepo = (
  root,
  { files = listFiles(root), waivers = [], waiversFile = "waivers.json" } = {},
) => {
  const topLevel = topLevelFolders(root);
  const findings = [];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    const report = (line, code, message, path) =>
      findings.push({ file, line, code, message, ...(path && { path }) });
    checkFrontmatter(file, text, report);
    checkReferences(root, file, text, topLevel, report);
  }
  return applyWaivers(findings, waivers, waiversFile).sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line,
  );
};

export const formatFinding = ({ file, line, code, message }) =>
  `${file}:${line}: ${code}: ${message}`;

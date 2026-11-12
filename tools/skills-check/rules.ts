import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, posix, relative, sep } from "node:path";

export const LAYERS = ["support", "shared", "domain", "features", "devtools"] as const;
const LAYERS_WITH_CATEGORY_READMES = ["domain", "features"];
const CURSOR_KEYS = new Set(["globs", "alwaysApply", "model", "is_background"]);
const IGNORED_DIRS = new Set([".git", "node_modules"]);

const KEY_LINE = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const CODE_SPAN = /(`+)(.+?)\1(?!`)/g;
const INLINE_LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const REFERENCE_LINK = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const PLAIN_PATH = /^[\w.@+-]+(?:\/[\w.@+-]+)*\/?$/;
const MIN_WHAT_WORDS = 3;
const MAX_SKILL_LINES = 500;
const MAX_AGENTS_LINES = 100;

export const DESCRIPTION_TRIGGER_CLAUSES = [
  "Use when",
  "Read when",
  "Use before",
  "Read before",
] as const;

const quotedClauses = (clauses: readonly string[]): string =>
  clauses.length === 1
    ? `"${clauses[0]}"`
    : `${clauses
        .slice(0, -1)
        .map(c => `"${c}"`)
        .join(", ")} or "${clauses.at(-1)}"`;

export const missingDescriptionClauseMessage = (): string =>
  `has no ${quotedClauses(DESCRIPTION_TRIGGER_CLAUSES)} clause`;

const clausePattern = DESCRIPTION_TRIGGER_CLAUSES.map(phrase =>
  phrase.split(/\s+/).join("\\s+"),
).join("|");
// Sentence ends at a period followed by a space or the end, so `Set.has()` stays in the clause.
const WHEN_CLAUSE = new RegExp(`\\b(?:${clausePattern})\\b(?:[^.]|\\.(?!\\s|$))*(?:\\.|$)`, "i");

export const CHECK_CODES = {
  frontmatter: "exactly one frontmatter block; `name` matches the folder; `description` present",
  "cursor-key": "no Cursor rule keys (`globs`, `alwaysApply`, `model`, `is_background`)",
  description: "skill description says what it does and names when to use it",
  "dead-link": "relative Markdown links resolve",
  "dead-path": "backticked repo paths under a top-level folder exist",
  length: `a \`SKILL.md\` has at most ${MAX_SKILL_LINES} lines and \`AGENTS.md\` at most ${MAX_AGENTS_LINES}`,
  waiver: "waivers.json entry is complete",
  "stale-waiver": "waivers.json entry still matches a finding",
  "waiver-list": "waivers.json must be a JSON array at the root",
} as const;

type FindingCode = keyof typeof CHECK_CODES;

export type Finding = {
  file: string;
  line: number;
  code: FindingCode;
  message: string;
  path?: string;
};

export type Waiver = {
  file?: string;
  path?: string;
  reason?: string;
};

/** A waiver with all fields present; `reason` is non-whitespace. */
type CompleteWaiver = Waiver & {
  file: string;
  path: string;
  reason: string;
};

export type ReportFinding = (
  line: number,
  code: FindingCode,
  message: string,
  path?: string,
) => void;

type ProseLine = { line: string; number: number };

/**
 * Narrows JSON array elements to waiver objects: each element is an object whose file, path,
 * and reason are kept only when they are strings (non-string fields are omitted).
 */
function waiversFromArrayEntries(entries: unknown[]): Waiver[] {
  return entries.map((entry: unknown) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return {};
    const w: Waiver = {};
    if ("file" in entry && typeof entry.file === "string") w.file = entry.file;
    if ("path" in entry && typeof entry.path === "string") w.path = entry.path;
    if ("reason" in entry && typeof entry.reason === "string") w.reason = entry.reason;
    return w;
  });
}

const toPosix = (path: string): string => path.split(sep).join(posix.sep);

const walkMarkdown = (dir: string, out: string[]): string[] => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) walkMarkdown(path, out);
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(path);
  }
  return out;
};

const subdirectories = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => join(dir, entry.name))
    : [];

export const listFiles = (root: string): string[] => {
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

const unquote = (value: string): string => value.replace(/^(["'])([\s\S]*)\1$/, "$2");

const isFullLineComment = (line: string): boolean => /^\s*#/.test(line);

/** Strip trailing `# comment` from an unquoted YAML scalar on one line. */
const stripUnquotedInlineComment = (text: string): string => {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) return text;
  const hash = text.indexOf(" #");
  return hash >= 0 ? text.slice(0, hash).trimEnd() : text;
};

const scalar = ([head, ...more]: string[]): string => {
  const continuation = more.map(line => line.trim()).filter(Boolean);
  if (/^[|>][-+]?$/.test(head.trim())) return continuation.join(" ");
  return unquote([head.trim(), ...continuation].join(" ").trim());
};

export const parseFrontmatter = (
  text: string,
): {
  data: Record<string, string>;
  keyLines: Map<string, number>;
  duplicated: boolean;
  duplicateLine: number;
} | null => {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---") return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trimEnd() === "---");
  if (end < 0) return null;

  const raw = new Map<string, string[]>();
  const keyLines = new Map<string, number>();
  let key: string | undefined;
  lines.slice(1, end).forEach((line, i) => {
    if (isFullLineComment(line)) return;
    const match = KEY_LINE.exec(line);
    if (match) {
      key = match[1];
      const value = stripUnquotedInlineComment(match[2] ?? "");
      raw.set(key, [value]);
      keyLines.set(key, i + 2);
    } else if (key) raw.get(key)!.push(line);
  });

  const next = lines.findIndex((line, i) => i > end && line.trim() !== "");
  const duplicated =
    next > 0 && lines[next].trimEnd() === "---" && KEY_LINE.test(lines[next + 1] ?? "");

  const data = Object.fromEntries([...raw].map(([name, parts]) => [name, scalar(parts)]));
  return { data, keyLines, duplicated, duplicateLine: next + 1 };
};

export const describeProblem = (description: string): string | null => {
  const clause = WHEN_CLAUSE.exec(description);
  if (!clause) return missingDescriptionClauseMessage();
  const what = description
    .replace(WHEN_CLAUSE, " ")
    .split(/\s+/)
    .filter(word => /\w/.test(word));
  if (what.length < MIN_WHAT_WORDS) return "says when to use the skill but not what it does";
  return null;
};

type FrontmatterKind =
  | { kind: "skill"; expectedName: string; nameSource: string }
  | { kind: "agent"; expectedName: string; nameSource: string }
  | null;

const frontmatterKind = (file: string): FrontmatterKind => {
  const parts = file.split("/");
  if (parts[0] !== ".agents") return null;
  if (parts[1] === "skills" && parts.length === 4 && parts[3] === "SKILL.md")
    return { kind: "skill", expectedName: parts[2], nameSource: "folder" };
  if (parts[1] === "agents" && parts.length === 3)
    return { kind: "agent", expectedName: basename(file, ".md"), nameSource: "file name" };
  return null;
};

const checkFrontmatter = (file: string, text: string, report: ReportFinding): void => {
  const target = frontmatterKind(file);
  if (!target) return;
  const fm = parseFrontmatter(text);
  if (!fm) return report(1, "frontmatter", "has no frontmatter block");
  if (fm.duplicated) report(fm.duplicateLine, "frontmatter", "has more than one frontmatter block");

  const { name, description } = fm.data;
  if (!name) report(1, "frontmatter", "has no `name`");
  else if (name !== target.expectedName)
    report(
      fm.keyLines.get("name") ?? 1,
      "frontmatter",
      `\`name: ${name}\` differs from the ${target.nameSource} \`${target.expectedName}\``,
    );
  if (!description) report(1, "frontmatter", "has no `description`");

  for (const key of fm.keyLines.keys())
    if (CURSOR_KEYS.has(key))
      report(
        fm.keyLines.get(key) ?? 1,
        "cursor-key",
        `\`${key}\` is a Cursor rule key, not a skill or agent key`,
      );

  if (target.kind === "skill" && description) {
    const problem = describeProblem(description);
    if (problem)
      report(fm.keyLines.get("description") ?? 1, "description", `description ${problem}`);
  }
};

const lineLimit = (file: string): number | null => {
  if (file === "AGENTS.md") return MAX_AGENTS_LINES;
  return frontmatterKind(file)?.kind === "skill" ? MAX_SKILL_LINES : null;
};

const checkLength = (file: string, text: string, report: ReportFinding): void => {
  const limit = lineLimit(file);
  const lines = text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0);
  if (limit && lines > limit)
    report(limit + 1, "length", `has ${lines} lines, over the ${limit}-line limit`);
};

const proseLines = (text: string): ProseLine[] => {
  const out: ProseLine[] = [];
  let fence: string | null = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    } else if (marker) fence = marker;
    else out.push({ line, number: i + 1 });
  });
  return out;
};

const linkTarget = (raw: string): string | null => {
  if (URL_SCHEME.test(raw) || raw.startsWith("//") || raw.startsWith("#")) return null;
  const path = raw.replace(/[#?].*$/, "");
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

const pathCandidate = (span: string, topLevel: Set<string>): string | null => {
  const path = span.trim().replace(/(?::\d+){1,2}$|#L\d+(?:-L\d+)?$/, "");
  if (!PLAIN_PATH.test(path) || !path.includes("/")) return null;
  const segments = path.split("/");
  if (!topLevel.has(segments[0]) || segments.includes("..") || segments.includes("..."))
    return null;
  return path;
};

// Build outputs are gitignored: absent from a fresh checkout without being drift.
const gitIgnored = (root: string, paths: string[]): Set<string> => {
  if (paths.length === 0) return new Set();
  try {
    const out = execFileSync("git", ["check-ignore", "--no-index", "--stdin"], {
      cwd: root,
      input: paths.join("\n"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return new Set(out.split("\n").filter(Boolean));
  } catch (error: unknown) {
    const e = error as { status?: number; stdout?: string };
    return new Set(e.status === 1 ? [] : (e.stdout ?? "").split("\n").filter(Boolean));
  }
};

const checkReferences = (
  root: string,
  file: string,
  text: string,
  topLevel: Set<string>,
  report: ReportFinding,
): void => {
  const missingPaths: { path: string; number: number }[] = [];
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
      if (!existsSync(resolved))
        report(number, "dead-link", `link to \`${raw}\` does not resolve`, raw);
    }
  }

  const ignored = gitIgnored(root, [...new Set(missingPaths.map(({ path }) => path))]);
  for (const { path, number } of missingPaths)
    if (!ignored.has(path)) report(number, "dead-path", `\`${path}\` does not exist`, path);
};

const topLevelFolders = (root: string): Set<string> =>
  new Set(
    readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !IGNORED_DIRS.has(entry.name))
      .map(entry => entry.name),
  );

const isWaived = (waiver: Waiver, finding: Finding): boolean =>
  (finding.code === "dead-path" || finding.code === "dead-link") &&
  waiver.file === finding.file &&
  waiver.path === finding.path;

const isComplete = (waiver: Waiver): waiver is CompleteWaiver =>
  Boolean(waiver.file && waiver.path && waiver.reason?.trim());

// A waiver needs a reason, and one that no longer matches is reported so the list cannot rot.
export const applyWaivers = (
  findings: Finding[],
  waivers: unknown,
  waiversFile: string,
): Finding[] => {
  if (!Array.isArray(waivers)) {
    return [
      ...findings,
      {
        file: waiversFile,
        line: 1,
        code: "waiver-list",
        message: `${waiversFile} must be a JSON array at the root`,
      },
    ];
  }
  const list = waiversFromArrayEntries(waivers);
  const valid = list.filter(isComplete);
  const kept = findings.filter(finding => !valid.some(waiver => isWaived(waiver, finding)));
  list.forEach((waiver, index) => {
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
  root: string,
  {
    files = listFiles(root),
    waivers = [],
    waiversFile = "waivers.json",
  }: { files?: string[]; waivers?: unknown; waiversFile?: string } = {},
): Finding[] => {
  const topLevel = topLevelFolders(root);
  const findings: Finding[] = [];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    const report: ReportFinding = (line, code, message, path): void => {
      findings.push({ file, line, code, message, ...(path && { path }) });
    };
    checkFrontmatter(file, text, report);
    checkLength(file, text, report);
    checkReferences(root, file, text, topLevel, report);
  }
  return applyWaivers(findings, waivers, waiversFile).sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line,
  );
};

export const formatFinding = ({ file, line, code, message }: Finding): string =>
  `${file}:${line}: ${code}: ${message}`;

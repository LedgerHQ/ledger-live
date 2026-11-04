import { type Tree, updateJson } from "@nx/devkit";
import { posix } from "path";
import {
  classifyEntries,
  collectEntryComponents,
  exportNamesFromEntry,
  parseModule,
} from "../../enforce-package-structure/components.js";
import { isInternalSpecifier } from "../../enforce-package-structure/rules.js";

export type Platform = "web" | "native";

export type FileReader = {
  isFile(path: string): boolean;
  readFile(path: string): string;
};

const BARREL = /^index(?:\.(?:web|native))?\.tsx?$/;

export function normalizeDirectory(directory: string | undefined): string | undefined {
  if (directory === undefined) return undefined;
  const normalized = posix.normalize(directory.replace(/\\/g, "/")).replace(/^\.?\/+|\/+$/g, "");
  if (normalized.split("/").includes("..")) {
    throw new Error(`--directory "${directory}" must stay inside the package's src/.`);
  }
  if (isInternalSpecifier(normalized)) {
    throw new Error(
      `--directory "${directory}" is a private location, and the generated component is public.`,
    );
  }
  return normalized === "." ? "" : normalized;
}

export function componentTargetDirectory(
  projectRoot: string,
  directory: string | undefined,
  entryFile: string,
): string {
  const normalized = normalizeDirectory(directory);
  return normalized === undefined
    ? posix.dirname(entryFile)
    : posix.join(projectRoot, "src", normalized);
}

export function createTreeReader(tree: Tree, projectRoot: string): FileReader {
  const root = projectRoot.replace(/\\/g, "/").replace(/^\.\/|\/+$/g, "");
  const cwd = process.cwd().replace(/\\/g, "/");

  function toTreePath(file: string): string {
    const normalized = file.replace(/\\/g, "/");
    if (tree.exists(normalized)) return normalized;
    const fromCwd = posix.relative(cwd, normalized);
    if (!fromCwd.startsWith("..") && tree.exists(fromCwd)) return fromCwd;
    const fromCwdSlash = `${cwd}/${root}/`;
    if (normalized.startsWith(fromCwdSlash)) return normalized.slice(cwd.length + 1);
    const marker = `/${root}/`;
    const index = normalized.indexOf(marker);
    if (index !== -1) return normalized.slice(index + 1);
    return normalized;
  }

  return {
    isFile(file) {
      const path = toTreePath(file);
      return tree.exists(path) && tree.isFile(path);
    },
    readFile(file) {
      return tree.read(toTreePath(file), "utf-8") ?? "";
    },
  };
}

export function universalEntryPaths(
  projectRoot: string,
  exportsField: unknown,
  reader: FileReader,
): string[] {
  const collected = collectEntryComponents(projectRoot, exportsField, reader);
  const paths = new Set<string>();
  for (const entry of collected.universal) {
    if (entry.files.web) paths.add(entry.files.web);
    if (entry.files.native) paths.add(entry.files.native);
  }
  const { unconditioned } = classifyEntries(exportsField);
  for (const entry of unconditioned) {
    if (entry.subpath === ".") paths.add(posix.join(projectRoot, entry.target));
  }
  return [...paths];
}

export function platformEntryPaths(
  projectRoot: string,
  exportsField: unknown,
): Partial<Record<Platform, string>> {
  const { platform } = classifyEntries(exportsField);
  return Object.fromEntries(
    platform.map(entry => [entry.platform, posix.join(projectRoot, entry.target)]),
  ) as Partial<Record<Platform, string>>;
}

export function platformEntryPath(
  projectRoot: string,
  exportsField: unknown,
  platform: Platform,
): string | undefined {
  return platformEntryPaths(projectRoot, exportsField)[platform];
}

export function sharedPlatformUniversalEntry(
  universalPaths: string[],
  platformPaths: Partial<Record<Platform, string>>,
): string | undefined {
  const platformEntries = (["web", "native"] as const)
    .map(platform => platformPaths[platform])
    .filter((file): file is string => file !== undefined);
  return platformEntries.find(file => universalPaths.includes(file));
}

export function firstClashingExportName(
  entryFiles: string[],
  names: string[],
  reader: FileReader,
): string | undefined {
  for (const file of entryFiles) {
    for (const platform of ["web", "native"] as const) {
      const exported = exportNamesFromEntry(file, platform, reader);
      const found = names.find(name => exported.has(name));
      if (found) return found;
    }
  }
  return undefined;
}

const REACH_SUFFIXES = [
  ".web.tsx",
  ".web.ts",
  ".native.tsx",
  ".native.ts",
  ".tsx",
  ".ts",
  "/index.web.ts",
  "/index.native.ts",
  "/index.tsx",
  "/index.ts",
];

function resolveReachTargets(fromFile: string, specifier: string, reader: FileReader): string[] {
  const base = posix.join(posix.dirname(fromFile), specifier);
  return REACH_SUFFIXES.map(suffix => `${base}${suffix}`).filter(path => reader.isFile(path));
}

export function platformReachableFiles(entryFiles: string[], reader: FileReader): Set<string> {
  const visited = new Set<string>();
  const queue = entryFiles.filter(file => reader.isFile(file));
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);
    let source: string;
    try {
      source = reader.readFile(file);
    } catch {
      continue;
    }
    const module = parseModule(file, source);
    for (const specifier of [...module.stars, ...(module.typeStars ?? [])]) {
      queue.push(...resolveReachTargets(file, specifier, reader));
    }
  }
  return visited;
}

export function entryReExportsDirectory(
  entryFile: string,
  dir: string,
  reader: FileReader,
): boolean {
  if (!reader.isFile(entryFile)) return false;
  const module = parseModule(entryFile, reader.readFile(entryFile));
  return module.stars.some(
    specifier => posix.join(posix.dirname(entryFile), specifier.replace(/\/index$/, "")) === dir,
  );
}

export function barrelsForComponent(
  tree: Tree,
  dir: string,
  universalEntries: string[],
  platformReach: Set<string>,
  reader: FileReader,
): string[] {
  if (universalEntries.every(entry => posix.dirname(entry) === dir)) return universalEntries;
  const localBarrels = tree.exists(dir)
    ? tree
        .children(dir)
        .filter(name => BARREL.test(name))
        .map(name => `${dir}/${name}`)
    : [];
  if (
    localBarrels.length > 0 &&
    !localBarrels.some(barrel => platformReach.has(barrel)) &&
    universalEntries.every(entry => entryReExportsDirectory(entry, dir, reader))
  ) {
    return localBarrels;
  }
  return universalEntries;
}

export function relativeSpecifier(fromFile: string, target: string): string {
  const relative = posix.relative(posix.dirname(fromFile), target);
  return relative.startsWith("../") ? relative : `./${relative}`;
}

export function insertPlatformExportEntry(
  tree: Tree,
  manifestPath: string,
  platform: Platform,
  entryFile: string,
  projectRoot: string,
): void {
  updateJson(tree, manifestPath, json => {
    const entries = Object.entries(json.exports);
    const at = entries.findIndex(([subpath]) => subpath === "./package.json");
    entries.splice(at === -1 ? entries.length : at, 0, [
      `./${platform}`,
      `./${posix.relative(projectRoot, entryFile)}`,
    ]);
    json.exports = Object.fromEntries(entries);
    return json;
  });
}

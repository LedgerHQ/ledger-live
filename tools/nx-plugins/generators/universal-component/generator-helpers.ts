import { type Tree, generateFiles, updateJson, workspaceRoot } from "@nx/devkit";
import { join, posix } from "path";
import {
  classifyEntries,
  collectEntryComponents,
  exportNamesFromEntry,
  parseModule,
  resolveRelative,
} from "../../enforce-package-structure/components.js";
import { isInternalSpecifier } from "../../enforce-package-structure/rules.js";
import type { UniversalComponentGeneratorSchema } from "./schema";

export type Platform = "web" | "native";

export type FileReader = {
  isFile(path: string): boolean;
  readFile(path: string): string;
};

const BARREL = /^index(?:\.(?:web|native))?\.tsx?$/;
const PLATFORMS: Platform[] = ["web", "native"];
const PLATFORM_FILE = /\.(?:web|native|ios|android)\.[cm]?[jt]sx?$/;

function absoluteModulePath(entryFile: string): string {
  const normalized = entryFile.replace(/\\/g, "/");
  if (posix.isAbsolute(normalized)) return normalized;
  return posix.join(workspaceRoot, normalized);
}

function treePathFromAbsolute(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, "/");
  const root = workspaceRoot.replace(/\\/g, "/");
  if (normalized.startsWith(`${root}/`)) return normalized.slice(root.length + 1);
  return normalized;
}

function resolveFromEntry(
  entryFile: string,
  specifier: string,
  platform: Platform,
  reader: FileReader,
): string | null {
  return resolveRelative(absoluteModulePath(entryFile), specifier, platform, undefined, reader);
}

export type GeneratorContext = {
  projectRoot: string;
  manifestPath: string;
  exportsField: Record<string, unknown>;
  reader: FileReader;
  templatesDir: string;
  className: string;
  fileName: string;
  breaksR5: string;
};

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
    if (entry.subpath !== ".") continue;
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

export function assertRawPlatformExportTargetsAreStrings(
  projectRoot: string,
  exportsField: Record<string, unknown>,
  breaksR5: string,
): void {
  for (const platform of PLATFORMS) {
    const raw = exportsField[`./${platform}`];
    if (raw !== undefined && typeof raw !== "string") {
      throw new Error(`${projectRoot}: the ./${platform} entry has conditions, ${breaksR5}`);
    }
  }
}

export function sharedPlatformUniversalEntry(
  universalPaths: string[],
  platformPaths: Partial<Record<Platform, string>>,
): string | undefined {
  const platformEntries = PLATFORMS.map(platform => platformPaths[platform]).filter(
    (file): file is string => file !== undefined,
  );
  return platformEntries.find(file => universalPaths.includes(file));
}

export function assertNoSharedPlatformUniversalModule(
  projectRoot: string,
  universalPaths: string[],
  platformPaths: Partial<Record<Platform, string>>,
  breaksR5: string,
): void {
  const sharedEntry = sharedPlatformUniversalEntry(universalPaths, platformPaths);
  if (sharedEntry !== undefined) {
    throw new Error(
      `${projectRoot}: a platform entry and the universal entry "." share ${sharedEntry}, so a component added to one leaks into the other, ${breaksR5} Give the platform entry a module of its own first.`,
    );
  }
}

export function firstClashingExportName(
  entryFiles: string[],
  names: string[],
  reader: FileReader,
): string | undefined {
  for (const file of entryFiles) {
    for (const platform of PLATFORMS) {
      const exported = exportNamesFromEntry(file, platform, reader);
      const found = names.find(name => exported.has(name));
      if (found) return found;
    }
  }
  return undefined;
}

// The modules the entries expose through `export *` and `export type *`, the entries included.
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
      for (const platform of PLATFORMS) {
        const target = resolveFromEntry(file, specifier, platform, reader);
        if (target !== null) queue.push(treePathFromAbsolute(target));
      }
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
  return module.stars.some(specifier => {
    for (const platform of PLATFORMS) {
      const resolved = resolveFromEntry(entryFile, specifier, platform, reader);
      if (resolved !== null && posix.dirname(treePathFromAbsolute(resolved)) === dir) {
        return true;
      }
    }
    return false;
  });
}

// The barrels the new lines go to: the folder's own barrel when every entry re-exports it and no
// platform entry reaches it, so it stays one level below them, else the entries themselves. Never a
// new barrel.
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

function appendLines(tree: Tree, file: string, lines: string[]) {
  const existing = tree.read(file, "utf-8") ?? "";
  const missing = lines.filter(line => !existing.split("\n").includes(line));
  if (missing.length === 0) return;
  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
  tree.write(file, `${existing}${separator}${missing.join("\n")}\n`);
}

function assertNewFiles(tree: Tree, files: string[]) {
  const existing = files.filter(file => tree.exists(file));
  if (existing.length > 0) {
    throw new Error(`Refusing to overwrite ${existing.join(", ")}.`);
  }
}

export function universalComponentTargetDirectory(
  projectRoot: string,
  directory: string | undefined,
): string {
  return posix.join(projectRoot, "src", directory ?? "");
}

export function universalComponentNewFilePaths(className: string, dir: string): string[] {
  const contractVariants = ["web", "native", "ios", "android"].flatMap(platform =>
    [".ts", ".tsx"].map(extension => `.types.${platform}${extension}`),
  );
  return [
    ".types.ts",
    ...contractVariants,
    ".web.tsx",
    ".native.tsx",
    ".web.test.tsx",
    ".native.test.tsx",
  ].map(suffix => `${dir}/${className}${suffix}`);
}

export function generatePlatformEntryComponent(
  tree: Tree,
  options: UniversalComponentGeneratorSchema,
  context: GeneratorContext,
  manifest: Record<string, unknown>,
): void {
  const platform = options.platformEntry!;
  const { projectRoot, manifestPath, exportsField, reader, templatesDir, className, breaksR5 } =
    context;
  const directory = normalizeDirectory(options.directory);
  const substitutions = { className, testId: context.fileName, tmpl: "" };
  const generatedNames = [className, `${className}Props`];
  const universalEntries = universalEntryPaths(projectRoot, exportsField, reader);

  const universalClash = firstClashingExportName(universalEntries, generatedNames, reader);
  if (universalClash !== undefined) {
    throw new Error(
      `${universalClash} is already exported from the universal entry "." of ${projectRoot}, ${breaksR5}`,
    );
  }
  if (
    !manifest.exports ||
    typeof manifest.exports !== "object" ||
    !Object.keys(manifest.exports).every(key => key.startsWith("."))
  ) {
    throw new Error(
      `${projectRoot}: package.json#exports must map subpaths to add ./${platform}, see docs/adr/universal-components.md.`,
    );
  }
  const existingEntry = platformEntryPath(projectRoot, exportsField, platform);
  const entryFile = existingEntry ?? `${projectRoot}/src/${platform}/index.${platform}.ts`;
  const platformClash = firstClashingExportName([entryFile], generatedNames, reader);
  if (platformClash !== undefined) {
    throw new Error(`${platformClash} is already exported from ./${platform} of ${projectRoot}.`);
  }
  const dir = componentTargetDirectory(projectRoot, directory, entryFile);
  assertNewFiles(
    tree,
    [".tsx", ".test.tsx"].map(suffix => `${dir}/${className}.${platform}${suffix}`),
  );

  if (existingEntry === undefined) {
    insertPlatformExportEntry(tree, manifestPath, platform, entryFile, projectRoot);
  }
  generateFiles(tree, join(templatesDir, platform), dir, { ...substitutions, universal: false });
  appendLines(tree, entryFile, [
    `export * from "${relativeSpecifier(entryFile, `${dir}/${className}`)}";`,
  ]);
}

export function generateUniversalComponent(
  tree: Tree,
  options: UniversalComponentGeneratorSchema,
  context: GeneratorContext,
): void {
  const { projectRoot, exportsField, reader, templatesDir, className, breaksR5 } = context;
  const directory = normalizeDirectory(options.directory);
  const substitutions = { className, testId: context.fileName, tmpl: "" };
  const generatedNames = [className, `${className}Props`];
  const universalEntries = universalEntryPaths(projectRoot, exportsField, reader);
  const platformEntries = PLATFORMS.map(platform =>
    platformEntryPath(projectRoot, exportsField, platform),
  ).filter((file): file is string => file !== undefined);

  if (universalEntries.length === 0) {
    throw new Error(
      `${projectRoot} has no "." entry in package.json#exports to export a universal component from, see docs/adr/universal-components.md.`,
    );
  }
  const platformClash = firstClashingExportName(platformEntries, generatedNames, reader);
  if (platformClash !== undefined) {
    throw new Error(
      `${platformClash} is already exported from a platform entry of ${projectRoot}, ${breaksR5}`,
    );
  }
  const universalClash = firstClashingExportName(universalEntries, generatedNames, reader);
  if (universalClash !== undefined) {
    throw new Error(`${universalClash} is already exported from "." of ${projectRoot}.`);
  }

  const dir = universalComponentTargetDirectory(projectRoot, directory);
  assertNewFiles(tree, universalComponentNewFilePaths(className, dir));
  const platformReach = platformReachableFiles(platformEntries, reader);
  const barrels = barrelsForComponent(tree, dir, universalEntries, platformReach, reader);
  const leakingBarrel = barrels.find(barrel => platformReach.has(barrel));
  if (leakingBarrel !== undefined) {
    throw new Error(
      `${projectRoot}: a platform entry re-exports ${leakingBarrel}, so a universal component added there leaks into it, ${breaksR5}`,
    );
  }
  for (const folder of ["contract", "web", "native"]) {
    generateFiles(tree, join(templatesDir, folder), dir, { ...substitutions, universal: true });
  }
  for (const barrel of barrels) {
    const specifier = relativeSpecifier(barrel, `${dir}/${className}`);
    appendLines(tree, barrel, [
      `export * from "${specifier}";`,
      `export type * from "${specifier}.types";`,
    ]);
  }
}

export function hasPlatformFiles(tree: Tree, dir: string): boolean {
  if (!tree.exists(dir)) return false;
  return tree.children(dir).some(name => {
    const path = `${dir}/${name}`;
    return tree.isFile(path) ? PLATFORM_FILE.test(name) : hasPlatformFiles(tree, path);
  });
}

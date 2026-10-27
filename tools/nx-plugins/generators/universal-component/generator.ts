import { type Tree, generateFiles, names, readJson, updateJson } from "@nx/devkit";
import type { UniversalComponentGeneratorSchema } from "./schema";
import { join, posix } from "path";

type Platform = "web" | "native";

const ADR = "docs/adr/universal-components.md";
const BREAKS_R5 = `which breaks R5, see ${ADR}.`;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const PLATFORM_FILE = /\.(?:web|native|ios|android)\.[cm]?[jt]sx?$/;
const BARREL = /^index(?:\.(?:web|native))?\.tsx?$/;
const STAR_EXPORT = /^export\s+\*\s+from\s+["'](\.[^"']*)["']/gm;
// Names the templates import, which a component of the same name would shadow.
const TEMPLATE_IMPORTS = new Set(["React", "View"]);
// What a relative specifier can load, on either platform.
const CANDIDATE_SUFFIXES = [
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

function hasReactNativeCondition(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  return Object.entries(target).some(
    ([key, value]) => key === "react-native" || hasReactNativeCondition(value),
  );
}

function hasPlatformFiles(tree: Tree, dir: string): boolean {
  if (!tree.exists(dir)) return false;
  return tree.children(dir).some(name => {
    const path = `${dir}/${name}`;
    return tree.isFile(path) ? PLATFORM_FILE.test(name) : hasPlatformFiles(tree, path);
  });
}

function toPackagePath(projectRoot: string, target: string): string {
  return posix.join(projectRoot, target);
}

// The modules a target points at, through nested conditions, type-only targets left out.
function conditionTargets(target: unknown): string[] {
  if (typeof target === "string") return [target];
  if (!target || typeof target !== "object") return [];
  return Object.entries(target)
    .filter(([condition]) => condition !== "types")
    .flatMap(([, value]) => conditionTargets(value));
}

function universalEntryFiles(projectRoot: string, exportsField: Record<string, unknown>): string[] {
  // An object of conditions alone is the target of the root entry.
  const hasSubpaths = Object.keys(exportsField).some(key => key.startsWith("."));
  const root = hasSubpaths ? exportsField["."] : exportsField;
  const targets = conditionTargets(root);
  return [...new Set(targets)].map(target => toPackagePath(projectRoot, target));
}

function platformEntryFile(
  projectRoot: string,
  exportsField: Record<string, unknown>,
  platform: Platform,
): string | undefined {
  const target = exportsField[`./${platform}`];
  if (target === undefined) return undefined;
  if (typeof target !== "string") {
    throw new Error(`${projectRoot}: the ./${platform} entry has conditions, ${BREAKS_R5}`);
  }
  return toPackagePath(projectRoot, target);
}

function resolveSpecifier(tree: Tree, fromFile: string, specifier: string): string[] {
  const base = posix.join(posix.dirname(fromFile), specifier);
  return CANDIDATE_SUFFIXES.map(suffix => `${base}${suffix}`).filter(file => tree.isFile(file));
}

// Follows `export *` from the entries and looks for a module declaring `name`.
function isExportedFrom(tree: Tree, entryFiles: string[], name: string): boolean {
  const declaration = new RegExp(
    `\\bexport\\s+(?:declare\\s+)?(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+${name}\\b|\\bexport\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`,
  );
  const visited = new Set<string>();
  const queue = entryFiles.filter(file => tree.isFile(file));
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = tree.read(file, "utf-8") ?? "";
    if (declaration.test(source)) return true;
    for (const [, specifier] of source.matchAll(STAR_EXPORT)) {
      queue.push(...resolveSpecifier(tree, file, specifier));
    }
  }
  return false;
}

function reachesDirectly(tree: Tree, entryFile: string, dir: string): boolean {
  const source = tree.read(entryFile, "utf-8") ?? "";
  return [...source.matchAll(STAR_EXPORT)].some(
    ([, specifier]) =>
      posix.join(posix.dirname(entryFile), specifier.replace(/\/index$/, "")) === dir,
  );
}

// The barrels the new lines go to: the folder's own barrel when every entry re-exports it, so it
// stays one level below them, else the entries themselves. Never a new barrel.
function barrelsFor(tree: Tree, dir: string, entryFiles: string[]): string[] {
  if (entryFiles.every(entry => posix.dirname(entry) === dir)) return entryFiles;
  const localBarrels = tree.exists(dir)
    ? tree
        .children(dir)
        .filter(name => BARREL.test(name))
        .map(name => `${dir}/${name}`)
    : [];
  if (localBarrels.length > 0 && entryFiles.every(entry => reachesDirectly(tree, entry, dir))) {
    return localBarrels;
  }
  return entryFiles;
}

function relativeSpecifier(fromFile: string, target: string): string {
  const relative = posix.relative(posix.dirname(fromFile), target);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function appendLines(tree: Tree, file: string, lines: string[]) {
  const existing = tree.read(file, "utf-8") ?? "";
  const missing = lines.filter(line => !existing.split("\n").includes(line));
  if (missing.length === 0) return;
  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
  tree.write(file, `${existing}${separator}${missing.join("\n")}\n`);
}

function normalizeDirectory(directory: string | undefined): string | undefined {
  if (directory === undefined) return undefined;
  const normalized = posix.normalize(directory.replace(/\\/g, "/")).replace(/^\.?\/+|\/+$/g, "");
  if (normalized.split("/").includes("..")) {
    throw new Error(`--directory "${directory}" must stay inside the package's src/.`);
  }
  return normalized === "." ? "" : normalized;
}

function assertNewFiles(tree: Tree, files: string[]) {
  const existing = files.filter(file => tree.exists(file));
  if (existing.length > 0) {
    throw new Error(`Refusing to overwrite ${existing.join(", ")}.`);
  }
}

export default async function universalComponentGenerator(
  tree: Tree,
  options: UniversalComponentGeneratorSchema,
) {
  const { className, fileName } = names(options.name);
  if (!PASCAL_CASE.test(className)) {
    throw new Error(`"${options.name}" does not give a PascalCase component name.`);
  }
  if (TEMPLATE_IMPORTS.has(className)) {
    throw new Error(`"${className}" shadows an import of the generated files, pick another name.`);
  }

  const projectRoot = options.project.replace(/\\/g, "/").replace(/^\.\/|\/+$/g, "");
  const manifestPath = `${projectRoot}/package.json`;
  if (!tree.exists(manifestPath)) {
    throw new Error(`No package.json at ${projectRoot}: --project takes the package root.`);
  }
  const manifest = readJson(tree, manifestPath);
  const exportsField: Record<string, unknown> =
    manifest.exports && typeof manifest.exports === "object" ? manifest.exports : {};

  if (!hasReactNativeCondition(manifest.exports) && !hasPlatformFiles(tree, `${projectRoot}/src`)) {
    throw new Error(
      `${projectRoot} is not a dual-platform package: package.json#exports has no "react-native" condition and src/ holds no .web or .native file. Universal and platform components belong to dual-platform packages, see ${ADR}.`,
    );
  }

  const universalEntries = universalEntryFiles(projectRoot, exportsField);
  const platformEntries = (["web", "native"] as const)
    .map(platform => platformEntryFile(projectRoot, exportsField, platform))
    .filter((file): file is string => file !== undefined);
  const sharedEntry = platformEntries.find(file => universalEntries.includes(file));
  if (sharedEntry !== undefined) {
    throw new Error(
      `${projectRoot}: a platform entry and the universal entry "." share ${sharedEntry}, so a component added to one leaks into the other, ${BREAKS_R5} Give the platform entry a module of its own first.`,
    );
  }
  const directory = normalizeDirectory(options.directory);
  const templates = join(__dirname, "files");
  const substitutions = { className, testId: fileName, tmpl: "" };

  if (options.platformEntry) {
    const platform = options.platformEntry;
    if (isExportedFrom(tree, universalEntries, className)) {
      throw new Error(
        `${className} is already exported from the universal entry "." of ${projectRoot}, ${BREAKS_R5}`,
      );
    }
    if (
      !manifest.exports ||
      typeof manifest.exports !== "object" ||
      !Object.keys(manifest.exports).every(key => key.startsWith("."))
    ) {
      throw new Error(
        `${projectRoot}: package.json#exports must map subpaths to add ./${platform}, see ${ADR}.`,
      );
    }
    const existingEntry = platformEntryFile(projectRoot, exportsField, platform);
    const entryFile = existingEntry ?? `${projectRoot}/src/${platform}/index.${platform}.ts`;
    if (isExportedFrom(tree, [entryFile], className)) {
      throw new Error(`${className} is already exported from ./${platform} of ${projectRoot}.`);
    }
    const dir =
      directory === undefined
        ? posix.dirname(entryFile)
        : posix.join(projectRoot, "src", directory);
    assertNewFiles(
      tree,
      [".tsx", ".test.tsx"].map(suffix => `${dir}/${className}.${platform}${suffix}`),
    );

    if (existingEntry === undefined) {
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
    generateFiles(tree, join(templates, platform), dir, { ...substitutions, universal: false });
    appendLines(tree, entryFile, [
      `export * from "${relativeSpecifier(entryFile, `${dir}/${className}`)}";`,
    ]);
    return;
  }

  if (universalEntries.length === 0) {
    throw new Error(
      `${projectRoot} has no "." entry in package.json#exports to export a universal component from, see ${ADR}.`,
    );
  }
  if (isExportedFrom(tree, platformEntries, className)) {
    throw new Error(
      `${className} is already exported from a platform entry of ${projectRoot}, ${BREAKS_R5}`,
    );
  }
  if (isExportedFrom(tree, universalEntries, className)) {
    throw new Error(`${className} is already exported from "." of ${projectRoot}.`);
  }

  const dir = posix.join(projectRoot, "src", directory ?? "");
  assertNewFiles(
    tree,
    [".types.ts", ".web.tsx", ".native.tsx", ".web.test.tsx", ".native.test.tsx"].map(
      suffix => `${dir}/${className}${suffix}`,
    ),
  );
  for (const folder of ["contract", "web", "native"]) {
    generateFiles(tree, join(templates, folder), dir, { ...substitutions, universal: true });
  }
  for (const barrel of barrelsFor(tree, dir, universalEntries)) {
    const specifier = relativeSpecifier(barrel, `${dir}/${className}`);
    appendLines(tree, barrel, [
      `export * from "${specifier}";`,
      `export type * from "${specifier}.types";`,
    ]);
  }
}

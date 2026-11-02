import { type Tree, generateFiles, names, readJson, updateJson } from "@nx/devkit";
import type { UniversalComponentGeneratorSchema } from "./schema";
import { join, posix } from "path";
import { isInternalSpecifier } from "../../enforce-package-structure/rules.js";

type Platform = "web" | "native";

const ADR = "docs/adr/universal-components.md";
const BREAKS_R5 = `which breaks R5, see ${ADR}.`;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const PLATFORM_FILE = /\.(?:web|native|ios|android)\.[cm]?[jt]sx?$/;
const BARREL = /^index(?:\.(?:web|native))?\.tsx?$/;
const STAR_EXPORT = /^export\s+\*\s+from\s+["'](\.[^"']*)["']/gm;
const ANY_STAR_EXPORT = /^export\s+(?:type\s+)?\*\s+from\s+["'](\.[^"']*)["']/gm;
// Names the templates import, which a component of the same name would shadow.
const TEMPLATE_IMPORTS = new Set(["React", "View"]);
const PLATFORMS: Platform[] = ["web", "native"];
// The packages each platform's templates import.
const TEMPLATE_DEPENDENCIES: Record<Platform, string[]> = {
  web: ["react", "@testing-library/react"],
  native: ["react", "react-native", "@testing-library/react-native"],
};
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

// The modules the entries expose through `export *` and `export type *`, the entries included.
function reachableFiles(tree: Tree, entryFiles: string[]): Set<string> {
  const visited = new Set<string>();
  const queue = entryFiles.filter(file => tree.isFile(file));
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = tree.read(file, "utf-8") ?? "";
    for (const [, specifier] of source.matchAll(ANY_STAR_EXPORT)) {
      queue.push(...resolveSpecifier(tree, file, specifier));
    }
  }
  return visited;
}

// The first of `names` that a module reachable from the entries declares, as a value or a type.
function exportedFrom(tree: Tree, entryFiles: string[], names: string[]): string | undefined {
  const sources = [...reachableFiles(tree, entryFiles)].map(file => tree.read(file, "utf-8") ?? "");
  return names.find(name => {
    const declaration = new RegExp(
      `\\bexport\\s+(?:declare\\s+)?(?:async\\s+|abstract\\s+|const\\s+(?=enum))?(?:function\\*?|const|let|var|class|type|interface|enum)\\s+${name}\\b|\\bexport\\s+(?:type\\s+)?\\{[^}]*\\b${name}\\b[^}]*\\}`,
    );
    return sources.some(source => declaration.test(source));
  });
}

function reachesDirectly(tree: Tree, entryFile: string, dir: string): boolean {
  const source = tree.read(entryFile, "utf-8") ?? "";
  return [...source.matchAll(STAR_EXPORT)].some(
    ([, specifier]) =>
      posix.join(posix.dirname(entryFile), specifier.replace(/\/index$/, "")) === dir,
  );
}

// The barrels the new lines go to: the folder's own barrel when every entry re-exports it and no
// platform entry reaches it, so it stays one level below them, else the entries themselves. Never a
// new barrel.
function barrelsFor(
  tree: Tree,
  dir: string,
  entryFiles: string[],
  platformReach: Set<string>,
): string[] {
  if (entryFiles.every(entry => posix.dirname(entry) === dir)) return entryFiles;
  const localBarrels = tree.exists(dir)
    ? tree
        .children(dir)
        .filter(name => BARREL.test(name))
        .map(name => `${dir}/${name}`)
    : [];
  if (
    localBarrels.length > 0 &&
    !localBarrels.some(barrel => platformReach.has(barrel)) &&
    entryFiles.every(entry => reachesDirectly(tree, entry, dir))
  ) {
    return localBarrels;
  }
  return entryFiles;
}

function relativeSpecifier(fromFile: string, target: string): string {
  const relative = posix.relative(posix.dirname(fromFile), target);
  return relative.startsWith("../") ? relative : `./${relative}`;
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
  if (isInternalSpecifier(normalized)) {
    throw new Error(
      `--directory "${directory}" is a private location, and the generated component is public.`,
    );
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

  const declared = new Set(
    ["dependencies", "devDependencies", "peerDependencies"].flatMap(field =>
      Object.keys(manifest[field] ?? {}),
    ),
  );
  const required = (options.platformEntry ? [options.platformEntry] : PLATFORMS).flatMap(
    platform => TEMPLATE_DEPENDENCIES[platform],
  );
  const missing = [...new Set(required)].filter(name => !declared.has(name));
  if (missing.length > 0) {
    throw new Error(
      `${projectRoot} does not declare ${missing.join(", ")}, which the generated files import. Add them to its package.json first.`,
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
  const generatedNames = [className, `${className}Props`];

  if (options.platformEntry) {
    const platform = options.platformEntry;
    const universalClash = exportedFrom(tree, universalEntries, generatedNames);
    if (universalClash !== undefined) {
      throw new Error(
        `${universalClash} is already exported from the universal entry "." of ${projectRoot}, ${BREAKS_R5}`,
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
    const platformClash = exportedFrom(tree, [entryFile], generatedNames);
    if (platformClash !== undefined) {
      throw new Error(`${platformClash} is already exported from ./${platform} of ${projectRoot}.`);
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
  const platformClash = exportedFrom(tree, platformEntries, generatedNames);
  if (platformClash !== undefined) {
    throw new Error(
      `${platformClash} is already exported from a platform entry of ${projectRoot}, ${BREAKS_R5}`,
    );
  }
  const universalClash = exportedFrom(tree, universalEntries, generatedNames);
  if (universalClash !== undefined) {
    throw new Error(`${universalClash} is already exported from "." of ${projectRoot}.`);
  }

  const dir = posix.join(projectRoot, "src", directory ?? "");
  // A platform-suffixed contract would shadow the shared one in the implementations' imports.
  const contractVariants = ["web", "native", "ios", "android"].flatMap(platform =>
    [".ts", ".tsx"].map(extension => `.types.${platform}${extension}`),
  );
  assertNewFiles(
    tree,
    [
      ".types.ts",
      ...contractVariants,
      ".web.tsx",
      ".native.tsx",
      ".web.test.tsx",
      ".native.test.tsx",
    ].map(suffix => `${dir}/${className}${suffix}`),
  );
  const platformReach = reachableFiles(tree, platformEntries);
  const barrels = barrelsFor(tree, dir, universalEntries, platformReach);
  const leakingBarrel = barrels.find(barrel => platformReach.has(barrel));
  if (leakingBarrel !== undefined) {
    throw new Error(
      `${projectRoot}: a platform entry re-exports ${leakingBarrel}, so a universal component added there leaks into it, ${BREAKS_R5}`,
    );
  }
  for (const folder of ["contract", "web", "native"]) {
    generateFiles(tree, join(templates, folder), dir, { ...substitutions, universal: true });
  }
  for (const barrel of barrels) {
    const specifier = relativeSpecifier(barrel, `${dir}/${className}`);
    appendLines(tree, barrel, [
      `export * from "${specifier}";`,
      `export type * from "${specifier}.types";`,
    ]);
  }
}

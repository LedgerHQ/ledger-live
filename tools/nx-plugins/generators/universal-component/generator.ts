import { type Tree, generateFiles, names, readJson } from "@nx/devkit";
import type { UniversalComponentGeneratorSchema } from "./schema";
import { join, posix } from "path";
import { hasReactNativeCondition } from "../../enforce-package-structure/components.js";
import {
  barrelsForComponent,
  componentTargetDirectory,
  createTreeReader,
  firstClashingExportName,
  insertPlatformExportEntry,
  normalizeDirectory,
  platformEntryPath,
  platformReachableFiles,
  relativeSpecifier,
  sharedPlatformUniversalEntry,
  universalEntryPaths,
  type Platform,
} from "./generator-helpers";

const ADR = "docs/adr/universal-components.md";
const BREAKS_R5 = `which breaks R5, see ${ADR}.`;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const PLATFORM_FILE = /\.(?:web|native|ios|android)\.[cm]?[jt]sx?$/;
const TEMPLATE_IMPORTS = new Set(["React", "View"]);
const PLATFORMS: Platform[] = ["web", "native"];
const TEMPLATE_DEPENDENCIES: Record<Platform, string[]> = {
  web: ["react", "@testing-library/react"],
  native: ["react", "react-native", "@testing-library/react-native"],
};

function hasPlatformFiles(tree: Tree, dir: string): boolean {
  if (!tree.exists(dir)) return false;
  return tree.children(dir).some(name => {
    const path = `${dir}/${name}`;
    return tree.isFile(path) ? PLATFORM_FILE.test(name) : hasPlatformFiles(tree, path);
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
  const reader = createTreeReader(tree, projectRoot);

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

  const universalEntries = universalEntryPaths(projectRoot, exportsField, reader);
  const platformEntries = PLATFORMS.map(platform =>
    platformEntryPath(projectRoot, exportsField, platform),
  ).filter((file): file is string => file !== undefined);
  const sharedEntry = sharedPlatformUniversalEntry(universalEntries, {
    web: platformEntryPath(projectRoot, exportsField, "web"),
    native: platformEntryPath(projectRoot, exportsField, "native"),
  });
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
    const universalClash = firstClashingExportName(universalEntries, generatedNames, reader);
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
    const rawPlatformTarget = exportsField[`./${platform}`];
    if (rawPlatformTarget !== undefined && typeof rawPlatformTarget !== "string") {
      throw new Error(`${projectRoot}: the ./${platform} entry has conditions, ${BREAKS_R5}`);
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
  const platformClash = firstClashingExportName(platformEntries, generatedNames, reader);
  if (platformClash !== undefined) {
    throw new Error(
      `${platformClash} is already exported from a platform entry of ${projectRoot}, ${BREAKS_R5}`,
    );
  }
  const universalClash = firstClashingExportName(universalEntries, generatedNames, reader);
  if (universalClash !== undefined) {
    throw new Error(`${universalClash} is already exported from "." of ${projectRoot}.`);
  }

  const dir = posix.join(projectRoot, "src", directory ?? "");
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
  const platformReach = platformReachableFiles(platformEntries, reader);
  const barrels = barrelsForComponent(tree, dir, universalEntries, platformReach, reader);
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

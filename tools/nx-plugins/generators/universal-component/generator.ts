import { type Tree, names, readJson } from "@nx/devkit";
import type { UniversalComponentGeneratorSchema } from "./schema";
import { join } from "path";
import { hasReactNativeCondition } from "../../enforce-package-structure/components.js";
import {
  assertNoSharedPlatformUniversalModule,
  assertRawPlatformExportTargetsAreStrings,
  createTreeReader,
  generatePlatformEntryComponent,
  generateUniversalComponent,
  hasPlatformFiles,
  platformEntryPath,
  type GeneratorContext,
  type Platform,
  universalEntryPaths,
} from "./generator-helpers";

const ADR = "docs/adr/universal-components.md";
const BREAKS_R5 = `which breaks R5, see ${ADR}.`;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
// Names the templates import, which a component of the same name would shadow.
const TEMPLATE_IMPORTS = new Set(["React", "View"]);
const PLATFORMS: Platform[] = ["web", "native"];
// The packages each platform's templates import.
const TEMPLATE_DEPENDENCIES: Record<Platform, string[]> = {
  web: ["react", "@testing-library/react"],
  native: ["react", "react-native", "@testing-library/react-native"],
};

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

  assertRawPlatformExportTargetsAreStrings(projectRoot, exportsField, BREAKS_R5);

  const universalEntries = universalEntryPaths(projectRoot, exportsField, reader);
  assertNoSharedPlatformUniversalModule(
    projectRoot,
    universalEntries,
    {
      web: platformEntryPath(projectRoot, exportsField, "web"),
      native: platformEntryPath(projectRoot, exportsField, "native"),
    },
    BREAKS_R5,
  );

  const context: GeneratorContext = {
    projectRoot,
    manifestPath,
    exportsField,
    reader,
    templatesDir: join(__dirname, "files"),
    className,
    fileName,
    breaksR5: BREAKS_R5,
  };

  if (options.platformEntry) {
    generatePlatformEntryComponent(tree, options, context, manifest);
    return;
  }

  generateUniversalComponent(tree, options, context);
}

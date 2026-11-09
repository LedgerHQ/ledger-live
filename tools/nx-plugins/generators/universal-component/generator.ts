import { type Tree, names, readJson } from "@nx/devkit";
import type { UniversalComponentGeneratorSchema } from "./schema";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  assertComponentName,
  assertDualPlatformPackage,
  assertNoSharedPlatformUniversalModule,
  assertRawPlatformExportTargetsAreStrings,
  assertTemplateDependencies,
  createTreeReader,
  generatePlatformEntryComponent,
  generateUniversalComponent,
  platformEntryPath,
  type GeneratorContext,
  universalEntryPaths,
} from "./generator-helpers.ts";

const ADR = "docs/adr/universal-components.md";
const BREAKS_R5 = `which breaks R5, see ${ADR}.`;

export default async function universalComponentGenerator(
  tree: Tree,
  options: UniversalComponentGeneratorSchema,
) {
  const { className, fileName } = names(options.name);
  assertComponentName(className, options.name);

  const projectRoot = options.project.replace(/\\/g, "/").replace(/^\.\/|\/+$/g, "");
  const manifestPath = `${projectRoot}/package.json`;
  if (!tree.exists(manifestPath)) {
    throw new Error(`No package.json at ${projectRoot}: --project takes the package root.`);
  }
  const manifest = readJson(tree, manifestPath);
  const exportsField: Record<string, unknown> =
    manifest.exports && typeof manifest.exports === "object" ? manifest.exports : {};
  const reader = createTreeReader(tree, projectRoot);

  assertDualPlatformPackage(tree, projectRoot, manifest, ADR);
  assertTemplateDependencies(projectRoot, manifest, options.platformEntry);

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
    templatesDir: join(dirname(fileURLToPath(import.meta.url)), "files"),
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

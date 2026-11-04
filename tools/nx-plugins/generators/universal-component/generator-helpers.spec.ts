import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { join } from "path";
import {
  assertNoSharedPlatformUniversalModule,
  assertRawPlatformExportTargetsAreStrings,
  barrelsForComponent,
  componentTargetDirectory,
  createTreeReader,
  entryReExportsDirectory,
  generatePlatformEntryComponent,
  insertPlatformExportEntry,
  normalizeDirectory,
  platformReachableFiles,
  relativeSpecifier,
  type GeneratorContext,
  universalEntryPaths,
} from "./generator-helpers";

const PACKAGE = "shared/thing";
const UNIVERSAL = { "react-native": "./src/index.native.ts", default: "./src/index.ts" };

function seedDualPackage(
  tree: ReturnType<typeof createTreeWithEmptyWorkspace>,
  exportsField: object,
) {
  tree.write(
    `${PACKAGE}/package.json`,
    JSON.stringify({
      name: "@shared/thing",
      exports: { ...exportsField, "./package.json": "./package.json" },
    }),
  );
  tree.write(`${PACKAGE}/src/index.ts`, 'export * from "./Folder";\n');
  tree.write(`${PACKAGE}/src/index.native.ts`, 'export * from "./Folder";\n');
  tree.write(`${PACKAGE}/src/Folder/index.ts`, 'export * from "./Widget";\n');
}

describe("normalizeDirectory", () => {
  it("rejects paths that escape src", () => {
    expect(() => normalizeDirectory("../lib")).toThrow(/inside the package's src/);
  });

  it("rejects private locations", () => {
    expect(() => normalizeDirectory("internals")).toThrow(/private location/);
  });
});

describe("componentTargetDirectory", () => {
  it("uses the platform entry directory when no directory is given", () => {
    expect(componentTargetDirectory(PACKAGE, undefined, `${PACKAGE}/src/web/index.web.ts`)).toBe(
      `${PACKAGE}/src/web`,
    );
  });

  it("joins an explicit directory under src", () => {
    expect(
      componentTargetDirectory(PACKAGE, "wallet", `${PACKAGE}/src/native/index.native.ts`),
    ).toBe(`${PACKAGE}/src/wallet`);
  });
});

describe("barrelsForComponent", () => {
  it("appends to a folder barrel the entries re-export directly", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    tree.write(`${PACKAGE}/src/Folder/index.ts`, 'export * from "./Widget";\n');
    const reader = createTreeReader(tree, PACKAGE);
    const universalEntries = universalEntryPaths(PACKAGE, { ".": UNIVERSAL }, reader);
    const dir = `${PACKAGE}/src/Folder`;
    const platformReach = platformReachableFiles([`${PACKAGE}/src/native/index.native.ts`], reader);

    expect(barrelsForComponent(tree, dir, universalEntries, platformReach, reader)).toEqual([
      `${PACKAGE}/src/Folder/index.ts`,
    ]);
    expect(entryReExportsDirectory(`${PACKAGE}/src/index.ts`, dir, reader)).toBe(true);
  });

  it("keeps universal entry barrels when a platform entry reaches the folder", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL, "./native": "./src/native/index.native.ts" });
    tree.write(`${PACKAGE}/src/shared/index.ts`, 'export * from "./Other";\n');
    tree.write(`${PACKAGE}/src/native/index.native.ts`, 'export * from "../shared";\n');
    for (const entry of ["index.ts", "index.native.ts"]) {
      tree.write(`${PACKAGE}/src/${entry}`, 'export * from "./shared";\n');
    }
    const reader = createTreeReader(tree, PACKAGE);
    const universalEntries = universalEntryPaths(
      PACKAGE,
      { ".": UNIVERSAL, "./native": "./src/native/index.native.ts" },
      reader,
    );
    const platformReach = platformReachableFiles([`${PACKAGE}/src/native/index.native.ts`], reader);

    expect(
      barrelsForComponent(tree, `${PACKAGE}/src/shared`, universalEntries, platformReach, reader),
    ).toEqual(universalEntries);
  });
});

describe("insertPlatformExportEntry", () => {
  it("adds the platform subpath before ./package.json", () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write(
      `${PACKAGE}/package.json`,
      JSON.stringify({ exports: { ".": "./src/index.ts", "./package.json": "./package.json" } }),
    );

    insertPlatformExportEntry(
      tree,
      `${PACKAGE}/package.json`,
      "web",
      `${PACKAGE}/src/web/index.web.ts`,
      PACKAGE,
    );

    expect(JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString()).exports).toEqual({
      ".": "./src/index.ts",
      "./web": "./src/web/index.web.ts",
      "./package.json": "./package.json",
    });
  });
});

describe("relativeSpecifier", () => {
  it("uses a ./ prefix for same-directory targets", () => {
    expect(relativeSpecifier(`${PACKAGE}/src/index.ts`, `${PACKAGE}/src/Widget`)).toBe("./Widget");
  });
});

describe("universalEntryPaths", () => {
  it("collects only the root universal entry, not other universal subpaths", () => {
    const tree = createTreeWithEmptyWorkspace();
    const exportsField = {
      ".": UNIVERSAL,
      "./hooks": { "react-native": "./src/hooks.native.ts", default: "./src/hooks.ts" },
    };
    seedDualPackage(tree, exportsField);
    tree.write(`${PACKAGE}/src/hooks.ts`, "export {};\n");
    tree.write(`${PACKAGE}/src/hooks.native.ts`, "export {};\n");
    const reader = createTreeReader(tree, PACKAGE);

    expect(universalEntryPaths(PACKAGE, exportsField, reader)).toEqual([
      `${PACKAGE}/src/index.ts`,
      `${PACKAGE}/src/index.native.ts`,
    ]);
  });
});

describe("assertRawPlatformExportTargetsAreStrings", () => {
  it("throws when a platform export uses conditions", () => {
    expect(() =>
      assertRawPlatformExportTargetsAreStrings(
        PACKAGE,
        { "./web": { default: "./src/web/index.web.ts" } },
        "which breaks R5, see docs/adr/universal-components.md.",
      ),
    ).toThrow(/the \.\/web entry has conditions/);
  });
});

describe("assertNoSharedPlatformUniversalModule", () => {
  it("throws when a platform entry resolves to a universal module", () => {
    expect(() =>
      assertNoSharedPlatformUniversalModule(
        PACKAGE,
        [`${PACKAGE}/src/index.native.ts`],
        { native: `${PACKAGE}/src/index.native.ts` },
        "which breaks R5, see docs/adr/universal-components.md.",
      ),
    ).toThrow(/share .*index\.native\.ts/);
  });
});

describe("generatePlatformEntryComponent", () => {
  it("creates the platform entry files under src/web", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree);
    const reader = createTreeReader(tree, PACKAGE);
    const manifest = JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString());
    const context: GeneratorContext = {
      projectRoot: PACKAGE,
      manifestPath: `${PACKAGE}/package.json`,
      exportsField: manifest.exports,
      reader,
      templatesDir: join(__dirname, "files"),
      className: "WalletButton",
      fileName: "walletButton",
      breaksR5: "which breaks R5, see docs/adr/universal-components.md.",
    };

    generatePlatformEntryComponent(
      tree,
      { name: "WalletButton", project: PACKAGE, platformEntry: "web" },
      context,
      manifest,
    );

    expect(tree.exists(`${PACKAGE}/src/web/WalletButton.web.tsx`)).toBe(true);
  });
});

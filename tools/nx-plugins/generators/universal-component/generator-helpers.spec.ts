import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import {
  barrelsForComponent,
  componentTargetDirectory,
  createTreeReader,
  entryReExportsDirectory,
  insertPlatformExportEntry,
  normalizeDirectory,
  platformReachableFiles,
  relativeSpecifier,
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

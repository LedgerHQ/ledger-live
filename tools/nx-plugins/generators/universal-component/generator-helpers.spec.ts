import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { join } from "path";
import {
  assertComponentName,
  assertDualPlatformPackage,
  assertNoSharedPlatformUniversalModule,
  assertRawPlatformExportTargetsAreStrings,
  assertTemplateDependencies,
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
  universalComponentTargetDirectory,
  universalEntryPaths,
} from "./generator-helpers";

const PACKAGE = "shared/thing";
const UNIVERSAL = { "react-native": "./src/index.native.ts", default: "./src/index.ts" };
const TEMPLATE_DEPENDENCIES = {
  dependencies: { react: "catalog:", "react-native": "catalog:" },
  devDependencies: {
    "@testing-library/react": "catalog:",
    "@testing-library/react-native": "catalog:",
  },
};

function seedDualPackage(
  tree: ReturnType<typeof createTreeWithEmptyWorkspace>,
  exportsField: object,
) {
  tree.write(
    `${PACKAGE}/package.json`,
    JSON.stringify({
      name: "@shared/thing",
      ...TEMPLATE_DEPENDENCIES,
      exports: { ...exportsField, "./package.json": "./package.json" },
    }),
  );
  tree.write(`${PACKAGE}/src/index.ts`, 'export * from "./Folder";\n');
  tree.write(`${PACKAGE}/src/index.native.ts`, 'export * from "./Folder";\n');
  tree.write(`${PACKAGE}/src/Folder/index.ts`, 'export * from "./Widget";\n');
}

describe("assertComponentName", () => {
  it("throws when the name is not PascalCase", () => {
    expect(() => assertComponentName("contactsButton", "contacts-button")).toThrow(
      /does not give a PascalCase component name/,
    );
  });

  it("accepts a valid PascalCase name", () => {
    expect(() => assertComponentName("ContactsButton", "contacts-button")).not.toThrow();
  });

  it.each(["React", "View"])("throws when %s shadows a template import", name => {
    expect(() => assertComponentName(name, name)).toThrow(/shadows an import/);
  });
});

describe("assertDualPlatformPackage", () => {
  it("throws when the package is not dual-platform", () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write("shared/logic/package.json", JSON.stringify({ exports: { ".": "./src/index.ts" } }));
    tree.write("shared/logic/src/index.ts", 'export * from "./sum";\n');
    const manifest = JSON.parse(tree.read("shared/logic/package.json", "utf-8")!.toString());

    expect(() =>
      assertDualPlatformPackage(tree, "shared/logic", manifest, "docs/adr/universal-components.md"),
    ).toThrow(/not a dual-platform package.*docs\/adr\/universal-components\.md/);
  });

  it("accepts a package with a react-native export condition", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    const manifest = JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString());

    expect(() =>
      assertDualPlatformPackage(tree, PACKAGE, manifest, "docs/adr/universal-components.md"),
    ).not.toThrow();
  });
});

describe("assertTemplateDependencies", () => {
  it("throws when required packages are missing from the manifest", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    const manifest = JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString());
    const stripped = {
      ...manifest,
      dependencies: { react: "catalog:" },
      devDependencies: {},
    };

    expect(() => assertTemplateDependencies(PACKAGE, stripped, undefined)).toThrow(
      "does not declare @testing-library/react, react-native, @testing-library/react-native, which the generated files import",
    );
  });

  it("accepts when all template dependencies are declared", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    const manifest = JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString());

    expect(() => assertTemplateDependencies(PACKAGE, manifest, undefined)).not.toThrow();
  });

  it("requires only the chosen platform packages for a platform entry", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    const manifest = JSON.parse(tree.read(`${PACKAGE}/package.json`, "utf-8")!.toString());
    const webOnly = {
      ...manifest,
      dependencies: { react: "catalog:" },
      devDependencies: { "@testing-library/react": "catalog:" },
    };

    expect(() => assertTemplateDependencies(PACKAGE, webOnly, "web")).not.toThrow();
    expect(() => assertTemplateDependencies(PACKAGE, webOnly, "native")).toThrow(
      /does not declare react-native, @testing-library\/react-native,/,
    );
  });
});

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

describe("universalComponentTargetDirectory", () => {
  it("defaults to src when no directory is given", () => {
    expect(universalComponentTargetDirectory(PACKAGE, undefined)).toBe(`${PACKAGE}/src`);
  });

  it("joins an explicit directory under src", () => {
    expect(universalComponentTargetDirectory(PACKAGE, "Folder")).toBe(`${PACKAGE}/src/Folder`);
  });

  it("rejects paths that escape src", () => {
    expect(() => universalComponentTargetDirectory(PACKAGE, "../lib")).toThrow(
      /inside the package's src/,
    );
  });
});

describe("barrelsForComponent", () => {
  it("appends to a folder barrel the entries re-export directly", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    tree.write(`${PACKAGE}/src/index.ts`, 'export * from "./Folder";\n');
    tree.write(`${PACKAGE}/src/index.native.ts`, 'export * from "./Folder";\n');
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

  it("uses universal entry barrels when entries only re-export a file inside the folder", () => {
    const tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL });
    tree.write(`${PACKAGE}/src/index.ts`, 'export * from "./Folder/Widget";\n');
    tree.write(`${PACKAGE}/src/index.native.ts`, 'export * from "./Folder/Widget";\n');
    tree.write(`${PACKAGE}/src/Folder/Widget.ts`, "export const Widget = 1;\n");
    tree.write(`${PACKAGE}/src/Folder/index.ts`, 'export * from "./Widget";\n');
    const reader = createTreeReader(tree, PACKAGE);
    const universalEntries = universalEntryPaths(PACKAGE, { ".": UNIVERSAL }, reader);
    const dir = `${PACKAGE}/src/Folder`;
    const platformReach = platformReachableFiles([`${PACKAGE}/src/native/index.native.ts`], reader);

    expect(barrelsForComponent(tree, dir, universalEntries, platformReach, reader)).toEqual(
      universalEntries,
    );
    expect(entryReExportsDirectory(`${PACKAGE}/src/index.ts`, dir, reader)).toBe(false);
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
    seedDualPackage(tree, { ".": UNIVERSAL });
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

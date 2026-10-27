import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { type Tree, readJson, visitNotIgnoredFiles } from "@nx/devkit";
import fs from "fs";
import os from "os";
import path from "path";
import ts from "typescript";
import { checkPackage } from "../../enforce-package-structure/validate.js";
import universalComponentGenerator from "./generator";

const WORKSPACE_ROOT = path.resolve(__dirname, "../../../..");
const PACKAGE = "shared/thing";
const REAL_PACKAGE = "shared/ui-qr-code";
const UNIVERSAL = { "react-native": "./src/index.native.ts", default: "./src/index.ts" };
const TEMPLATE_DEPENDENCIES = {
  dependencies: { react: "catalog:", "react-native": "catalog:" },
  devDependencies: {
    "@testing-library/react": "catalog:",
    "@testing-library/react-native": "catalog:",
  },
};

const temporaryWorkspaces: string[] = [];

// Two programs over a package that reaches React Native take longer than the default 5 s.
jest.setTimeout(120_000);

afterAll(() => {
  for (const dir of temporaryWorkspaces) fs.rmSync(dir, { recursive: true, force: true });
});

function seedDualPackage(tree: Tree, exportsField: object = { ".": UNIVERSAL }) {
  tree.write(
    `${PACKAGE}/package.json`,
    JSON.stringify({
      name: "@shared/thing",
      ...TEMPLATE_DEPENDENCIES,
      exports: { ...exportsField, "./package.json": "./package.json" },
    }),
  );
  tree.write(
    `${PACKAGE}/src/index.ts`,
    'export * from "./Existing";\nexport type * from "./Existing.types";\n',
  );
  tree.write(
    `${PACKAGE}/src/index.native.ts`,
    'export * from "./Existing";\nexport type * from "./Existing.types";\n',
  );
  tree.write(
    `${PACKAGE}/src/Existing.types.ts`,
    "export type ExistingProps = Readonly<{ testID?: string }>;\n",
  );
  for (const platform of ["web", "native"]) {
    tree.write(
      `${PACKAGE}/src/Existing.${platform}.tsx`,
      'import type { ExistingProps } from "./Existing.types";\n\nexport function Existing({ testID }: ExistingProps) {\n  return null;\n}\n',
    );
  }
}

function seedFromDisk(tree: Tree, projectRoot: string) {
  function copy(relative: string) {
    const full = path.join(WORKSPACE_ROOT, relative);
    if (fs.statSync(full).isDirectory()) {
      for (const name of fs.readdirSync(full)) copy(path.posix.join(relative, name));
    } else {
      tree.write(relative, fs.readFileSync(full));
    }
  }
  copy(`${projectRoot}/package.json`);
  copy(`${projectRoot}/src`);
}

function readText(tree: Tree, file: string): string {
  return tree.read(file, "utf-8") ?? "";
}

function barrels(tree: Tree, projectRoot = PACKAGE): string[] {
  const found: string[] = [];
  visitNotIgnoredFiles(tree, projectRoot, file => {
    if (/\/index(\.[a-z]+)?\.tsx?$/.test(file)) found.push(file);
  });
  return found.sort();
}

// Writes the package to a workspace on disk, so the package-structure check reads what the
// generator wrote.
function structureViolations(tree: Tree, projectRoot = PACKAGE): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "universal-component-"));
  temporaryWorkspaces.push(dir);
  visitNotIgnoredFiles(tree, projectRoot, file => {
    const full = path.join(dir, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, tree.read(file)!);
  });
  return checkPackage(dir, projectRoot).map(
    (v: { rule?: string; code: string; file: string }) => `${v.rule ?? "-"} ${v.code} ${v.file}`,
  );
}

describe("universal component", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree);
  });

  it("writes the contract, both implementations and a test per platform", async () => {
    await universalComponentGenerator(tree, { name: "contactsButton", project: PACKAGE });

    for (const suffix of ["types.ts", "web.tsx", "native.tsx", "web.test.tsx", "native.test.tsx"]) {
      expect(tree.exists(`${PACKAGE}/src/ContactsButton.${suffix}`)).toBe(true);
    }
    const contract = readText(tree, `${PACKAGE}/src/ContactsButton.types.ts`);
    expect(contract).toContain("export type ContactsButtonProps = Readonly<{");
    expect(contract).toContain("testID?: string;");
    expect(contract).not.toMatch(/import|on[A-Z]\w*\s*[?:]/);
    for (const platform of ["web", "native"]) {
      const implementation = readText(tree, `${PACKAGE}/src/ContactsButton.${platform}.tsx`);
      expect(implementation).toContain(
        'import type { ContactsButtonProps } from "./ContactsButton.types";',
      );
      expect(implementation.match(/^export /gm)).toEqual(["export "]);
      expect(readText(tree, `${PACKAGE}/src/ContactsButton.${platform}.test.tsx`)).toContain(
        'testID="contacts-button"',
      );
    }
  });

  it("appends the component and its contract to both entry barrels", async () => {
    await universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE });

    for (const barrel of ["index.ts", "index.native.ts"]) {
      expect(readText(tree, `${PACKAGE}/src/${barrel}`)).toBe(
        'export * from "./Existing";\nexport type * from "./Existing.types";\n' +
          'export * from "./ContactsButton";\nexport type * from "./ContactsButton.types";\n',
      );
    }
    expect(structureViolations(tree)).toEqual([]);
  });

  it("re-exports a component in a new folder from the entries, without a new barrel", async () => {
    const before = barrels(tree);

    await universalComponentGenerator(tree, {
      name: "ContactsButton",
      project: PACKAGE,
      directory: "components/ContactsButton",
    });

    expect(tree.exists(`${PACKAGE}/src/components/ContactsButton/ContactsButton.types.ts`)).toBe(
      true,
    );
    expect(readText(tree, `${PACKAGE}/src/index.ts`)).toContain(
      'export * from "./components/ContactsButton/ContactsButton";\nexport type * from "./components/ContactsButton/ContactsButton.types";\n',
    );
    expect(barrels(tree)).toEqual(before);
    expect(structureViolations(tree)).toEqual([]);
  });

  it("appends to a folder barrel that the entries re-export, keeping it one level deep", async () => {
    tree.write(`${PACKAGE}/src/components/index.ts`, 'export * from "./Other";\n');
    tree.write(
      `${PACKAGE}/src/components/Other.types.ts`,
      "export type OtherProps = Readonly<{ testID?: string }>;\n",
    );
    for (const platform of ["web", "native"]) {
      tree.write(
        `${PACKAGE}/src/components/Other.${platform}.tsx`,
        'import type { OtherProps } from "./Other.types";\n\nexport function Other({ testID }: OtherProps) {\n  return null;\n}\n',
      );
    }
    for (const entry of ["index.ts", "index.native.ts"]) {
      tree.write(
        `${PACKAGE}/src/${entry}`,
        `${readText(tree, `${PACKAGE}/src/${entry}`)}export * from "./components";\n`,
      );
    }
    const entryBefore = readText(tree, `${PACKAGE}/src/index.ts`);

    await universalComponentGenerator(tree, {
      name: "ContactsButton",
      project: PACKAGE,
      directory: "components",
    });

    expect(readText(tree, `${PACKAGE}/src/components/index.ts`)).toBe(
      'export * from "./Other";\nexport * from "./ContactsButton";\nexport type * from "./ContactsButton.types";\n',
    );
    expect(readText(tree, `${PACKAGE}/src/index.ts`)).toBe(entryBefore);
    expect(structureViolations(tree)).toEqual([]);
  });

  it("writes into an unconditioned entry that resolves per platform", async () => {
    tree.write(
      `${PACKAGE}/package.json`,
      JSON.stringify({
        ...TEMPLATE_DEPENDENCIES,
        exports: { ".": "./src/index.ts", "./package.json": "./package.json" },
      }),
    );
    tree.delete(`${PACKAGE}/src/index.native.ts`);

    await universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE });

    expect(readText(tree, `${PACKAGE}/src/index.ts`)).toContain(
      'export * from "./ContactsButton";',
    );
    expect(tree.exists(`${PACKAGE}/src/index.native.ts`)).toBe(false);
    expect(structureViolations(tree)).toEqual([]);
  });

  it("fails the structure check once the contract is broken by hand", async () => {
    await universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE });
    tree.write(
      `${PACKAGE}/src/ContactsButton.types.ts`,
      "export type ContactsButtonProps = Readonly<{ onPress: () => void; className?: string }>;\n",
    );

    expect(structureViolations(tree)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^R3 /)]),
    );
  });

  it("refuses a package that is not dual-platform, pointing at the ADR", async () => {
    tree.write("shared/logic/package.json", JSON.stringify({ exports: { ".": "./src/index.ts" } }));
    tree.write("shared/logic/src/index.ts", 'export * from "./sum";\n');

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: "shared/logic" }),
    ).rejects.toThrow(/not a dual-platform package.*docs\/adr\/universal-components\.md/);
  });

  it("refuses a name the universal entry already exports", async () => {
    await expect(
      universalComponentGenerator(tree, { name: "Existing", project: PACKAGE }),
    ).rejects.toThrow(/already exported from "\."/);
  });

  it("refuses a name a platform entry already exports (R5)", async () => {
    await universalComponentGenerator(tree, {
      name: "WalletButton",
      project: PACKAGE,
      platformEntry: "native",
    });

    await expect(
      universalComponentGenerator(tree, {
        name: "WalletButton",
        project: PACKAGE,
        directory: "wallet",
      }),
    ).rejects.toThrow(
      /platform entry of .*, which breaks R5, see docs\/adr\/universal-components\.md/,
    );
  });

  it("refuses a directory outside src", async () => {
    await expect(
      universalComponentGenerator(tree, {
        name: "ContactsButton",
        project: PACKAGE,
        directory: "../lib",
      }),
    ).rejects.toThrow(/inside the package's src/);
  });

  it.each(["components/internals", "internals", "helpers.internals"])(
    "refuses the private directory %s",
    async directory => {
      await expect(
        universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE, directory }),
      ).rejects.toThrow(/private location/);
      expect(tree.exists(`${PACKAGE}/src/${directory}`)).toBe(false);
    },
  );

  it("re-exports a component in a dot-folder through a relative specifier", async () => {
    await universalComponentGenerator(tree, {
      name: "ContactsButton",
      project: PACKAGE,
      directory: ".generated",
    });

    expect(readText(tree, `${PACKAGE}/src/index.ts`)).toContain(
      'export * from "./.generated/ContactsButton";',
    );
  });

  it.each([
    ["a type", "export type ContactsButton = string;\n"],
    ["an interface", "export interface ContactsButton {\n  id: string;\n}\n"],
    ["an enum", "export enum ContactsButton {\n  Primary,\n}\n"],
    ["a type-only re-export", 'export type { Model as ContactsButton } from "./model";\n'],
  ])("refuses a name already exported as %s", async (_, source) => {
    tree.write(`${PACKAGE}/src/model/types.ts`, source);
    tree.write(`${PACKAGE}/src/model/index.ts`, 'export type * from "./types";\n');
    for (const entry of ["index.ts", "index.native.ts"]) {
      tree.write(
        `${PACKAGE}/src/${entry}`,
        `${readText(tree, `${PACKAGE}/src/${entry}`)}export type * from "./model";\n`,
      );
    }

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(/already exported from "\."/);
    expect(tree.exists(`${PACKAGE}/src/ContactsButton.types.ts`)).toBe(false);
  });

  it("writes into the entries of nested conditions", async () => {
    seedDualPackage(tree, {
      ".": {
        types: "./src/index.ts",
        "react-native": { default: "./src/index.native.ts" },
        default: "./src/index.ts",
      },
    });

    await universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE });

    for (const barrel of ["index.ts", "index.native.ts"]) {
      expect(readText(tree, `${PACKAGE}/src/${barrel}`)).toContain(
        'export * from "./ContactsButton";',
      );
    }
  });

  it("refuses a package whose platform entry is the universal entry's module", async () => {
    seedDualPackage(tree, { ".": UNIVERSAL, "./native": "./src/index.native.ts" });

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(/share shared\/thing\/src\/index\.native\.ts.*which breaks R5/);
  });

  it("refuses to overwrite a test written first", async () => {
    tree.write(`${PACKAGE}/src/ContactsButton.native.test.tsx`, "// written first\n");

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(/Refusing to overwrite .*ContactsButton\.native\.test\.tsx/);
    expect(readText(tree, `${PACKAGE}/src/ContactsButton.native.test.tsx`)).toBe(
      "// written first\n",
    );
  });

  it.each(["React", "View"])("refuses %s, which the templates import", async name => {
    await expect(universalComponentGenerator(tree, { name, project: PACKAGE })).rejects.toThrow(
      /shadows an import/,
    );
  });
});

describe("platform component", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree);
  });

  it.each(["web", "native"] as const)(
    "creates src/%s/index.%s.ts and the ./%s entry",
    async platform => {
      await universalComponentGenerator(tree, {
        name: "WalletButton",
        project: PACKAGE,
        platformEntry: platform,
      });

      const entry = `${PACKAGE}/src/${platform}/index.${platform}.ts`;
      expect(readText(tree, entry)).toBe('export * from "./WalletButton";\n');
      const component = readText(tree, `${PACKAGE}/src/${platform}/WalletButton.${platform}.tsx`);
      expect(component).toContain("export type WalletButtonProps = Readonly<{");
      expect(component).toContain("export function WalletButton(");
      expect(tree.exists(`${PACKAGE}/src/${platform}/WalletButton.${platform}.test.tsx`)).toBe(
        true,
      );
      expect(Object.keys(readJson(tree, `${PACKAGE}/package.json`).exports)).toEqual([
        ".",
        `./${platform}`,
        "./package.json",
      ]);
      expect(readJson(tree, `${PACKAGE}/package.json`).exports[`./${platform}`]).toBe(
        `./src/${platform}/index.${platform}.ts`,
      );
      expect(structureViolations(tree)).toEqual([]);
    },
  );

  it("appends to an existing platform entry", async () => {
    seedDualPackage(tree, { ".": UNIVERSAL, "./native": "./src/nativeExports.native.ts" });
    tree.write(`${PACKAGE}/src/nativeExports.native.ts`, 'export * from "./AddToWallet";\n');
    tree.write(
      `${PACKAGE}/src/AddToWallet.native.tsx`,
      "export function AddToWallet() {\n  return null;\n}\n",
    );

    await universalComponentGenerator(tree, {
      name: "WalletButton",
      project: PACKAGE,
      platformEntry: "native",
      directory: "wallet",
    });

    expect(readText(tree, `${PACKAGE}/src/nativeExports.native.ts`)).toBe(
      'export * from "./AddToWallet";\nexport * from "./wallet/WalletButton";\n',
    );
    expect(tree.exists(`${PACKAGE}/src/native/index.native.ts`)).toBe(false);
    expect(structureViolations(tree)).toEqual([]);
  });

  it("refuses a component already exported from the universal entry (R5)", async () => {
    const manifest = readText(tree, `${PACKAGE}/package.json`);

    await expect(
      universalComponentGenerator(tree, {
        name: "Existing",
        project: PACKAGE,
        platformEntry: "web",
      }),
    ).rejects.toThrow(
      /universal entry .*, which breaks R5, see docs\/adr\/universal-components\.md/,
    );
    expect(readText(tree, `${PACKAGE}/package.json`)).toBe(manifest);
  });

  it("refuses to append to a platform entry that the universal entry also resolves to", async () => {
    seedDualPackage(tree, { ".": UNIVERSAL, "./native": "./src/index.native.ts" });
    const nativeEntry = readText(tree, `${PACKAGE}/src/index.native.ts`);

    await expect(
      universalComponentGenerator(tree, {
        name: "WalletButton",
        project: PACKAGE,
        platformEntry: "native",
      }),
    ).rejects.toThrow(/share .*index\.native\.ts.*which breaks R5/);
    expect(readText(tree, `${PACKAGE}/src/index.native.ts`)).toBe(nativeEntry);
  });

  it("refuses to overwrite a test written first, before touching the manifest", async () => {
    const manifest = readText(tree, `${PACKAGE}/package.json`);
    tree.write(`${PACKAGE}/src/web/WalletButton.web.test.tsx`, "// written first\n");

    await expect(
      universalComponentGenerator(tree, {
        name: "WalletButton",
        project: PACKAGE,
        platformEntry: "web",
      }),
    ).rejects.toThrow(/Refusing to overwrite .*WalletButton\.web\.test\.tsx/);
    expect(readText(tree, `${PACKAGE}/package.json`)).toBe(manifest);
  });

  it("refuses a package that does not declare what the templates import, naming it", async () => {
    const manifest = readJson(tree, `${PACKAGE}/package.json`);
    tree.write(
      `${PACKAGE}/package.json`,
      JSON.stringify({ ...manifest, dependencies: { react: "catalog:" }, devDependencies: {} }),
    );

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(
      "does not declare @testing-library/react, react-native, @testing-library/react-native, which the generated files import",
    );
    expect(tree.exists(`${PACKAGE}/src/ContactsButton.types.ts`)).toBe(false);
  });

  it("requires only the chosen platform's packages for a platform component", async () => {
    const manifest = readJson(tree, `${PACKAGE}/package.json`);
    tree.write(
      `${PACKAGE}/package.json`,
      JSON.stringify({
        ...manifest,
        dependencies: { react: "catalog:" },
        devDependencies: { "@testing-library/react": "catalog:" },
      }),
    );

    await universalComponentGenerator(tree, {
      name: "WalletButton",
      project: PACKAGE,
      platformEntry: "web",
    });
    await expect(
      universalComponentGenerator(tree, {
        name: "WalletPass",
        project: PACKAGE,
        platformEntry: "native",
      }),
    ).rejects.toThrow(/does not declare react-native, @testing-library\/react-native,/);
  });

  it("refuses a props name the platform entry already exports", async () => {
    seedDualPackage(tree, { ".": UNIVERSAL, "./web": "./src/web/index.web.ts" });
    tree.write(`${PACKAGE}/src/web/index.web.ts`, 'export type * from "./types";\n');
    tree.write(`${PACKAGE}/src/web/types.ts`, "export type WalletButtonProps = string;\n");

    await expect(
      universalComponentGenerator(tree, {
        name: "WalletButton",
        project: PACKAGE,
        platformEntry: "web",
      }),
    ).rejects.toThrow(/WalletButtonProps is already exported from \.\/web/);
    expect(tree.exists(`${PACKAGE}/src/web/WalletButton.web.tsx`)).toBe(false);
  });
});

describe("universal component next to platform entries", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    seedDualPackage(tree, { ".": UNIVERSAL, "./native": "./src/native/index.native.ts" });
    tree.write(`${PACKAGE}/src/shared/index.ts`, 'export * from "./Other";\n');
    tree.write(`${PACKAGE}/src/shared/Other.ts`, "export const other = 1;\n");
    for (const entry of ["index.ts", "index.native.ts"]) {
      tree.write(
        `${PACKAGE}/src/${entry}`,
        `${readText(tree, `${PACKAGE}/src/${entry}`)}export * from "./shared";\n`,
      );
    }
  });

  it("writes into the entries when a platform entry reaches the folder barrel", async () => {
    tree.write(`${PACKAGE}/src/native/index.native.ts`, 'export * from "../shared";\n');
    const sharedBarrel = readText(tree, `${PACKAGE}/src/shared/index.ts`);

    await universalComponentGenerator(tree, {
      name: "ContactsButton",
      project: PACKAGE,
      directory: "shared",
    });

    expect(readText(tree, `${PACKAGE}/src/shared/index.ts`)).toBe(sharedBarrel);
    for (const entry of ["index.ts", "index.native.ts"]) {
      expect(readText(tree, `${PACKAGE}/src/${entry}`)).toContain(
        'export * from "./shared/ContactsButton";',
      );
    }
  });

  it("refuses when a platform entry reaches the universal entry itself", async () => {
    tree.write(`${PACKAGE}/src/native/index.native.ts`, 'export * from "../index.native";\n');

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(/platform entry re-exports .*index\.native\.ts.*which breaks R5/);
    expect(tree.exists(`${PACKAGE}/src/ContactsButton.types.ts`)).toBe(false);
  });

  it("refuses a props name the universal entry already exports", async () => {
    tree.write(`${PACKAGE}/src/shared/Other.ts`, "export type ContactsButtonProps = string;\n");

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(/ContactsButtonProps is already exported from "\."/);
  });

  it.each(["web", "native"])("refuses a %s-suffixed contract sibling", async platform => {
    tree.write(`${PACKAGE}/src/ContactsButton.types.${platform}.ts`, "export {};\n");

    await expect(
      universalComponentGenerator(tree, { name: "ContactsButton", project: PACKAGE }),
    ).rejects.toThrow(
      new RegExp(`Refusing to overwrite .*ContactsButton\\.types\\.${platform}\\.ts`),
    );
    expect(tree.exists(`${PACKAGE}/src/ContactsButton.types.ts`)).toBe(false);
  });
});

// The generated files over a real dual package, typechecked in memory with the options of its two
// tsconfig projects, so React and React Native types come from its own node_modules.
describe("typecheck over a real dual package", () => {
  const otherSuffix = { web: ".native.", native: ".web." } as const;

  function overlayOf(tree: Tree): Map<string, string> {
    const overlay = new Map<string, string>();
    for (const change of tree.listChanges()) {
      if (change.type !== "DELETE" && change.path.startsWith(`${REAL_PACKAGE}/`)) {
        overlay.set(path.join(WORKSPACE_ROOT, change.path), change.content!.toString("utf-8"));
      }
    }
    return overlay;
  }

  function typecheck(
    overlay: Map<string, string>,
    platform: "web" | "native",
    generated: string[],
  ) {
    const configPath = path.join(WORKSPACE_ROOT, REAL_PACKAGE, `tsconfig.${platform}.json`);
    const parsed = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    })!;
    // The presets exclude the other platform's files; the generated ones follow the same rule.
    expect(parsed.fileNames.filter(file => file.includes(otherSuffix[platform]))).toEqual([]);
    const ownFiles = generated
      .map(file => path.join(WORKSPACE_ROOT, file))
      .filter(file => !path.basename(file).includes(otherSuffix[platform]));

    const host = ts.createCompilerHost(parsed.options, true);
    const { fileExists, readFile, directoryExists, getSourceFile } = host;
    host.fileExists = file => overlay.has(path.resolve(file)) || fileExists.call(host, file);
    host.readFile = file => overlay.get(path.resolve(file)) ?? readFile.call(host, file);
    host.directoryExists = dir =>
      [...overlay.keys()].some(file => file.startsWith(path.resolve(dir) + path.sep)) ||
      (directoryExists?.call(host, dir) ?? true);
    host.getSourceFile = (file, languageVersion, onError, shouldCreate) => {
      const text = overlay.get(path.resolve(file));
      return text === undefined
        ? getSourceFile.call(host, file, languageVersion, onError, shouldCreate)
        : ts.createSourceFile(file, text, languageVersion);
    };

    const program = ts.createProgram({
      rootNames: [...new Set([...parsed.fileNames, ...ownFiles])],
      options: parsed.options,
      projectReferences: parsed.projectReferences,
      host,
    });
    for (const file of ownFiles) expect(program.getSourceFile(file)).toBeDefined();
    return ts.formatDiagnostics(ts.getPreEmitDiagnostics(program), {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => WORKSPACE_ROOT,
      getNewLine: () => "\n",
    });
  }

  // The seed is a copy of the disk, so a generated file is one the disk does not have.
  function generatedFiles(tree: Tree): string[] {
    return tree
      .listChanges()
      .map(change => change.path)
      .filter(file => /\.tsx?$/.test(file) && !fs.existsSync(path.join(WORKSPACE_ROOT, file)));
  }

  let universalTree: Tree;

  beforeAll(async () => {
    universalTree = createTreeWithEmptyWorkspace();
    seedFromDisk(universalTree, REAL_PACKAGE);
    await universalComponentGenerator(universalTree, {
      name: "ContactsButton",
      project: REAL_PACKAGE,
      directory: "components/ContactsButton",
    });
  });

  it.each(["web", "native"] as const)("reports nothing for the %s project", platform => {
    const generated = generatedFiles(universalTree);
    expect(generated).toHaveLength(5);

    expect(typecheck(overlayOf(universalTree), platform, generated)).toBe("");
  });

  it.each(["web", "native"] as const)(
    "reports the implementation once its contract is renamed, on %s",
    platform => {
      const overlay = overlayOf(universalTree);
      const contract = path.join(
        WORKSPACE_ROOT,
        REAL_PACKAGE,
        "src/components/ContactsButton/ContactsButton.types.ts",
      );
      overlay.set(contract, overlay.get(contract)!.replace("ContactsButtonProps", "RenamedProps"));

      expect(typecheck(overlay, platform, generatedFiles(universalTree))).toContain(
        `ContactsButton.${platform}.tsx`,
      );
    },
  );

  it.each(["web", "native"] as const)(
    "reports nothing for a platform component on %s",
    async platform => {
      const tree = createTreeWithEmptyWorkspace();
      seedFromDisk(tree, REAL_PACKAGE);
      await universalComponentGenerator(tree, {
        name: "WalletButton",
        project: REAL_PACKAGE,
        platformEntry: platform,
      });

      expect(typecheck(overlayOf(tree), platform, generatedFiles(tree))).toBe("");
      expect(structureViolations(tree, REAL_PACKAGE)).toEqual([]);
    },
  );

  it("leaves the real package passing the structure check", () => {
    expect(structureViolations(universalTree, REAL_PACKAGE)).toEqual([]);
  });
});

import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { type Tree, readJson, visitNotIgnoredFiles } from "@nx/devkit";
import fs from "fs";
import os from "os";
import path from "path";
import { checkPackage } from "../../enforce-package-structure/validate.js";
import packageGenerator, { LAYERS } from "./generator";
import type { Layer, Platform } from "./schema";

const WORKSPACE_ROOT = path.resolve(__dirname, "../../../..");
const GENERATOR_DIR = __dirname;

const schemaJson = JSON.parse(
  fs.readFileSync(path.join(GENERATOR_DIR, "schema.json"), "utf-8"),
) as {
  properties: {
    layer: { enum: Layer[]; "x-prompt": { items: Layer[] } };
    platform: { enum: Platform[]; "x-prompt": { items: Platform[] } };
  };
};

const ALL_PLATFORMS = schemaJson.properties.platform.enum;

function unionMembersFromSchemaDts(typeName: "Layer" | "Platform"): string[] {
  const text = fs.readFileSync(path.join(GENERATOR_DIR, "schema.d.ts"), "utf-8");
  const match = text.match(new RegExp(`export type ${typeName} =\\s*([^;]+);`));
  if (!match) {
    throw new Error(`Could not parse ${typeName} in schema.d.ts`);
  }
  return match[1].split("|").map(part => part.trim().replace(/^"|"$/g, ""));
}

const temporaryWorkspaces: string[] = [];

afterAll(() => {
  for (const dir of temporaryWorkspaces) fs.rmSync(dir, { recursive: true, force: true });
});

const PAIRS = (Object.keys(LAYERS) as Layer[]).flatMap(layer =>
  ALL_PLATFORMS.filter(platform => LAYERS[layer].platforms[platform]).map(
    platform => [layer, platform] as const,
  ),
);

const FORBIDDEN = (Object.keys(LAYERS) as Layer[]).flatMap(layer =>
  ALL_PLATFORMS.filter(platform => !LAYERS[layer].platforms[platform]).map(
    platform => [layer, platform] as const,
  ),
);

const EXPECTED_NAMES: Record<Layer, [string, string]> = {
  shared: ["shared/thing-box", "@shared/thing-box"],
  "domain-entity": ["domain/entity/thing-box", "@domain/entity-thing-box"],
  "domain-api": ["domain/api/thing-box", "@domain/api-thing-box"],
  "feature-platform": ["features/platform/thing-box", "@features/platform-thing-box"],
  "feature-flow": ["features/flow/thing-box", "@features/flow-thing-box"],
};

function files(tree: Tree, root: string): string[] {
  const found: string[] = [];
  visitNotIgnoredFiles(tree, root, file => found.push(path.relative(root, file)));
  return found.sort();
}

function read(tree: Tree, file: string): string {
  return tree.read(file, "utf-8") ?? "";
}

// Writes the package to a workspace on disk, so the package-structure check reads what the
// generator wrote.
function structureViolations(tree: Tree, projectRoot: string): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "package-generator-"));
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

describe("schema and types stay aligned with LAYERS", () => {
  const layerKeys = Object.keys(LAYERS);

  it("keeps layer names in schema.json, schema.d.ts and LAYERS in sync", () => {
    expect(schemaJson.properties.layer.enum).toEqual(layerKeys);
    expect(schemaJson.properties.layer["x-prompt"].items).toEqual(layerKeys);
    expect(unionMembersFromSchemaDts("Layer")).toEqual(layerKeys);
  });

  it("keeps platform names in schema.json, schema.d.ts and ALL_PLATFORMS in sync", () => {
    const { enum: platformEnum, "x-prompt": platformPrompt } = schemaJson.properties.platform;
    expect(platformPrompt.items).toEqual(platformEnum);
    expect(unionMembersFromSchemaDts("Platform")).toEqual(platformEnum);
    expect(ALL_PLATFORMS).toEqual(platformEnum);
  });
});

describe("the layer table", () => {
  it.each(PAIRS)(
    "names a tsconfig archetype and a jest factory that exist, %s %s",
    (layer, platform) => {
      const shape = LAYERS[layer].platforms[platform]!;
      expect(
        fs.existsSync(path.join(WORKSPACE_ROOT, "support/tsconfig", `${shape.tsconfig}.json`)),
      ).toBe(true);
      const preset = require(path.join(WORKSPACE_ROOT, "support/jest", shape.jest.preset));
      expect(typeof preset[shape.jest.factory]).toBe("function");
    },
  );
});

describe.each(PAIRS)("a %s package on %s", (layer, platform) => {
  const [projectRoot, packageName] = EXPECTED_NAMES[layer];
  const dual = platform === "dual";
  const shape = LAYERS[layer].platforms[platform]!;
  let tree: Tree;

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace();
    await packageGenerator(tree, { name: "thing-box", layer, platform, skipFormat: true });
  });

  it("writes the file tree", () => {
    const testFile = platform === "native" ? "thingBox.native.test.ts" : "thingBox.test.ts";
    expect(files(tree, projectRoot)).toEqual(
      [
        "README.md",
        "jest.config.js",
        "package.json",
        "project.json",
        "tsconfig.json",
        ...(dual ? ["tsconfig.native.json", "tsconfig.web.json"] : []),
        "src/index.ts",
        ...(dual ? ["src/index.native.ts"] : []),
        "src/internals.ts",
        "src/thingBox.ts",
        `src/${testFile}`,
      ].sort(),
    );
  });

  it("names the package from its folder and exposes explicit exports", () => {
    const manifest = readJson(tree, `${projectRoot}/package.json`);
    expect(manifest.name).toBe(packageName);
    expect(manifest.private).toBe(true);
    expect(manifest.sideEffects).toBe(false);
    expect(manifest.exports).toEqual({
      ".": dual
        ? { "react-native": "./src/index.native.ts", default: "./src/index.ts" }
        : "./src/index.ts",
      "./package.json": "./package.json",
    });
    expect(Object.keys(manifest.exports).some(key => key.includes("*"))).toBe(false);
  });

  it("carries the scripts, and every tool they run as a catalog or workspace dependency", () => {
    const { scripts, devDependencies } = readJson(tree, `${projectRoot}/package.json`);
    expect(scripts).toEqual({
      lint: LAYERS[layer].lintScript,
      format: "oxfmt src",
      "format:check": "oxfmt src --check",
      typecheck: dual
        ? "tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.native.json"
        : "tsc --noEmit",
      test: "jest",
      coverage: "jest --coverage",
    });
    for (const tool of ["@typescript/native", "oxlint", "oxfmt", "jest", "@swc/jest"]) {
      expect(devDependencies[tool]).toBe("catalog:");
    }
    expect(devDependencies["@support/jest"]).toBe("workspace:*");
    for (const version of Object.values(devDependencies)) {
      expect(["catalog:", "workspace:*"]).toContain(version);
    }
    expect(devDependencies["jest-environment-jsdom"] !== undefined).toBe(shape.jest.jsdom);
  });

  it("extends the archetype of the platform", () => {
    const tsconfig = readJson(tree, `${projectRoot}/tsconfig.json`);
    expect(tsconfig.extends).toBe(`@support/tsconfig/${shape.tsconfig}`);
    expect(tsconfig.compilerOptions).toEqual({ types: ["jest"] });
    expect(tsconfig.references).toEqual(
      dual ? [{ path: "./tsconfig.web.json" }, { path: "./tsconfig.native.json" }] : undefined,
    );
  });

  it("composes a platform config over the solution root of a dual package", () => {
    const sides = ["web", "native"].filter(side =>
      tree.exists(`${projectRoot}/tsconfig.${side}.json`),
    );
    expect(sides.map(side => readJson(tree, `${projectRoot}/tsconfig.${side}.json`))).toEqual(
      dual
        ? sides.map(side => ({ extends: ["./tsconfig.json", `@support/tsconfig/${side}`] }))
        : [],
    );
    expect(sides).toEqual(dual ? ["web", "native"] : []);
  });

  it("builds the jest config with one preset factory call", () => {
    const args = shape.jest.rootDir ? "{ rootDir: __dirname }" : "";
    expect(read(tree, `${projectRoot}/jest.config.js`)).toBe(
      `module.exports = require("@support/jest/${shape.jest.preset}").${shape.jest.factory}(${args});\n`,
    );
  });

  it("writes a README with the title, a description placeholder and the UNSTABLE callout", () => {
    const readme = read(tree, `${projectRoot}/README.md`);
    expect(readme.split("\n").slice(0, 4)).toEqual([
      `# ${packageName}`,
      "",
      "> [!CAUTION]",
      "> **Status: UNSTABLE**. New package, in active development.",
    ]);
    expect(readme).toContain("TODO: one line on what this package owns.");
  });

  it("writes a project.json with a no-op build", () => {
    expect(readJson(tree, `${projectRoot}/project.json`)).toEqual({
      name: packageName,
      targets: { build: { executor: "nx:noop" } },
    });
  });

  it("keeps the barrels pure and private code in internals", () => {
    const barrel = 'export * from "./thingBox";\n';
    expect(read(tree, `${projectRoot}/src/index.ts`)).toBe(barrel);
    expect(read(tree, `${projectRoot}/src/index.native.ts`)).toBe(dual ? barrel : "");
    expect(read(tree, `${projectRoot}/src/thingBox.ts`)).toContain('from "./internals"');
    expect(structureViolations(tree, projectRoot)).toEqual([]);
  });
});

describe("the options", () => {
  it.each(FORBIDDEN)("rejects %s on %s, naming the allowed platforms", async (layer, platform) => {
    const allowed = Object.keys(LAYERS[layer].platforms).join(", ");
    await expect(
      packageGenerator(createTreeWithEmptyWorkspace(), {
        name: "thing-box",
        layer,
        platform,
        skipFormat: true,
      }),
    ).rejects.toThrow(`Allowed platforms: ${allowed}.`);
  });

  it("forbids React in domain/ and a flow without UI", () => {
    expect(FORBIDDEN).toEqual(
      expect.arrayContaining([
        ["domain-entity", "web"],
        ["domain-entity", "dual"],
        ["domain-api", "native"],
        ["feature-flow", "logic"],
      ]),
    );
  });

  it("rejects a name that is not kebab-case", async () => {
    await expect(
      packageGenerator(createTreeWithEmptyWorkspace(), {
        name: "ThingBox",
        layer: "shared",
        platform: "logic",
        skipFormat: true,
      }),
    ).rejects.toThrow("must be kebab-case");
  });

  it.each(["index", "internals"])("rejects the reserved name %s", async name => {
    await expect(
      packageGenerator(createTreeWithEmptyWorkspace(), {
        name,
        layer: "shared",
        platform: "logic",
        skipFormat: true,
      }),
    ).rejects.toThrow("reserved because it would overwrite scaffold files");
  });

  it("refuses to overwrite an existing package", async () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write("shared/thing-box/package.json", "{}");
    await expect(
      packageGenerator(tree, {
        name: "thing-box",
        layer: "shared",
        platform: "logic",
        skipFormat: true,
      }),
    ).rejects.toThrow("shared/thing-box already exists.");
  });

  it("writes the given description in the manifest and the README", async () => {
    const tree = createTreeWithEmptyWorkspace();
    await packageGenerator(tree, {
      name: "thing-box",
      layer: "shared",
      platform: "logic",
      description: "Boxes things.",
      skipFormat: true,
    });
    expect(readJson(tree, "shared/thing-box/package.json").description).toBe("Boxes things.");
    expect(read(tree, "shared/thing-box/README.md")).toContain("\nBoxes things.\n");
  });
});

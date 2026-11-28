import { type Tree, formatFiles, generateFiles, logger, names, writeJson } from "@nx/devkit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { Layer, PackageGeneratorSchema, Platform } from "./schema";

type Archetype = "logic" | "client" | "web" | "native" | "dual";

type JestPreset = Readonly<{
  preset: "shared" | "features-flow";
  factory: string;
  // A node preset derives the lcov root from rootDir; the others know their layer's depth.
  rootDir: boolean;
  // A web project runs in jsdom with the jest-dom matchers.
  jsdom: boolean;
}>;

type Shape = Readonly<{ tsconfig: Archetype; jest: JestPreset }>;

type LayerSpec = Readonly<{
  dir: string;
  scope: string;
  lintScript: string;
  // Packages its lint preset loads reach a package only through this edge (lint:tool-config).
  lintDevDependencies?: Readonly<Record<string, string>>;
  platforms: Readonly<Partial<Record<Platform, Shape>>>;
}>;

const NODE_JEST: JestPreset = {
  preset: "shared",
  factory: "createSharedJestConfig",
  rootDir: true,
  jsdom: false,
};

const SHARED_UI_JEST: JestPreset = {
  preset: "shared",
  factory: "createSharedUiJestConfig",
  rootDir: false,
  jsdom: true,
};

const SHARED_UI_NATIVE_JEST: JestPreset = {
  preset: "shared",
  factory: "createSharedUiNativeJestConfig",
  rootDir: false,
  jsdom: false,
};

const FLOW_JEST: JestPreset = {
  preset: "features-flow",
  factory: "createFlowJestConfig",
  rootDir: false,
  jsdom: true,
};

const FLOW_NATIVE_JEST: JestPreset = {
  preset: "features-flow",
  factory: "createFlowNativeJestConfig",
  rootDir: false,
  jsdom: false,
};

const FEATURE_UI_PLATFORMS = {
  web: { tsconfig: "web", jest: FLOW_JEST },
  native: { tsconfig: "native", jest: FLOW_NATIVE_JEST },
  dual: { tsconfig: "dual", jest: FLOW_JEST },
} as const satisfies Partial<Record<Platform, Shape>>;

// Every layer, the platforms its docs allow, and the tsconfig archetype and jest preset of each.
// domain/ holds no React (structure-flow skill), and a flow is a journey the user sees.
export const LAYERS: Readonly<Record<Layer, LayerSpec>> = {
  shared: {
    dir: "shared",
    scope: "@shared/",
    lintScript: "oxlint ./src",
    platforms: {
      logic: { tsconfig: "logic", jest: NODE_JEST },
      web: { tsconfig: "web", jest: SHARED_UI_JEST },
      native: { tsconfig: "native", jest: SHARED_UI_NATIVE_JEST },
      dual: { tsconfig: "dual", jest: SHARED_UI_JEST },
    },
  },
  "domain-entity": {
    dir: "domain/entity",
    scope: "@domain/entity-",
    lintScript: "oxlint ./src",
    platforms: { logic: { tsconfig: "logic", jest: NODE_JEST } },
  },
  "domain-api": {
    dir: "domain/api",
    scope: "@domain/api-",
    lintScript: "oxlint ./src",
    // RTK Query reaches fetch and the DOM types, as every domain/api package does.
    platforms: { logic: { tsconfig: "client", jest: NODE_JEST } },
  },
  "feature-platform": {
    dir: "features/platform",
    scope: "@features/platform-",
    lintScript: "oxlint src",
    platforms: { logic: { tsconfig: "logic", jest: NODE_JEST }, ...FEATURE_UI_PLATFORMS },
  },
  "feature-flow": {
    dir: "features/flow",
    scope: "@features/flow-",
    lintScript: "oxlint src",
    lintDevDependencies: { "@support/lint": "workspace:*" },
    platforms: FEATURE_UI_PLATFORMS,
  },
};

// nx loads the generator as an ES module, jest as CommonJS: import.meta.url works in both.
const TEMPLATES = dirname(fileURLToPath(import.meta.url));

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const RESERVED_NAMES = new Set(["index", "internals"]);

const DEFAULT_DESCRIPTION = "TODO: one line on what this package owns.";

// Every package runs these tools from its scripts and jest config.
const BASE_DEV_DEPENDENCIES = {
  "@ledgerhq/test-quarantine": "workspace:*",
  "@support/jest": "workspace:*",
  "@swc/core": "catalog:",
  "@swc/jest": "catalog:",
  "@types/jest": "catalog:",
  "@typescript/native": "catalog:",
  jest: "catalog:",
  oxfmt: "catalog:",
  oxlint: "catalog:",
  typescript: "catalog:",
};

const WEB_TEST_DEV_DEPENDENCIES = {
  "@testing-library/jest-dom": "catalog:",
  "jest-environment-jsdom": "catalog:",
};

const SEED_TEST_SUFFIX: Record<Platform, string> = {
  logic: "test",
  web: "test",
  dual: "test",
  // The native presets only match *.native.test.ts.
  native: "native.test",
};

function sorted(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function resolvePackage(options: Pick<PackageGeneratorSchema, "name" | "layer" | "platform">) {
  const layer = LAYERS[options.layer];
  if (!layer) {
    throw new Error(
      `Unknown layer "${options.layer}". Allowed layers: ${Object.keys(LAYERS).join(", ")}.`,
    );
  }
  if (!KEBAB_CASE.test(options.name)) {
    throw new Error(`Package name "${options.name}" must be kebab-case, e.g. "my-package".`);
  }
  if (RESERVED_NAMES.has(options.name)) {
    throw new Error(
      `Package name "${options.name}" is reserved because it would overwrite scaffold files in src/.`,
    );
  }
  const shape = layer.platforms[options.platform];
  if (!shape) {
    throw new Error(
      `The ${options.layer} layer does not allow the "${options.platform}" platform. ` +
        `Allowed platforms: ${Object.keys(layer.platforms).join(", ")}.`,
    );
  }
  return {
    layer,
    shape,
    projectRoot: `${layer.dir}/${options.name}`,
    packageName: `${layer.scope}${options.name}`,
  };
}

function packageJson(
  options: PackageGeneratorSchema,
  { layer, shape, packageName }: ReturnType<typeof resolvePackage>,
  description: string,
) {
  const dual = options.platform === "dual";
  return {
    name: packageName,
    version: "0.1.0",
    private: true,
    description,
    main: "src/index.ts",
    ...(dual && { "react-native": "src/index.native.ts" }),
    types: "src/index.ts",
    exports: {
      ".": dual
        ? { "react-native": "./src/index.native.ts", default: "./src/index.ts" }
        : "./src/index.ts",
      "./package.json": "./package.json",
    },
    sideEffects: false,
    scripts: {
      lint: layer.lintScript,
      format: "oxfmt src",
      "format:check": "oxfmt src --check",
      typecheck: dual
        ? "tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.native.json"
        : "tsc --noEmit",
      test: "jest",
      coverage: "jest --coverage",
    },
    devDependencies: sorted({
      ...BASE_DEV_DEPENDENCIES,
      ...layer.lintDevDependencies,
      ...(shape.jest.jsdom && WEB_TEST_DEV_DEPENDENCIES),
    }),
  };
}

function writeTsconfigs(tree: Tree, projectRoot: string, archetype: Archetype) {
  const compilerOptions = { types: ["jest"] };
  if (archetype !== "dual") {
    writeJson(tree, `${projectRoot}/tsconfig.json`, {
      extends: `@support/tsconfig/${archetype}`,
      compilerOptions,
    });
    return;
  }
  writeJson(tree, `${projectRoot}/tsconfig.json`, {
    extends: "@support/tsconfig/dual",
    compilerOptions,
    references: [{ path: "./tsconfig.web.json" }, { path: "./tsconfig.native.json" }],
  });
  for (const platform of ["web", "native"]) {
    writeJson(tree, `${projectRoot}/tsconfig.${platform}.json`, {
      extends: ["./tsconfig.json", `@support/tsconfig/${platform}`],
    });
  }
}

export default async function packageGenerator(tree: Tree, options: PackageGeneratorSchema) {
  const resolved = resolvePackage(options);
  const { projectRoot, packageName, shape } = resolved;
  if (tree.exists(projectRoot)) {
    throw new Error(`${projectRoot} already exists.`);
  }

  const description = options.description?.trim() || DEFAULT_DESCRIPTION;
  const { propertyName, className } = names(options.name);
  const substitutions = {
    tmpl: "",
    packageName,
    description,
    moduleName: propertyName,
    functionName: `get${className}PackageName`,
    testSuffix: SEED_TEST_SUFFIX[options.platform],
    jestPreset: shape.jest.preset,
    jestFactory: shape.jest.factory,
    jestArguments: shape.jest.rootDir ? "{ rootDir: __dirname }" : "",
  };

  generateFiles(tree, join(TEMPLATES, "files"), projectRoot, substitutions);
  if (options.platform === "dual") {
    generateFiles(tree, join(TEMPLATES, "files-dual"), projectRoot, substitutions);
  }

  writeJson(tree, `${projectRoot}/package.json`, packageJson(options, resolved, description));
  writeTsconfigs(tree, projectRoot, shape.tsconfig);

  if (!options.skipFormat) await formatFiles(tree);

  return () => {
    logger.info(`Created ${packageName} in ${projectRoot}. Run pnpm i to link it.`);
  };
}

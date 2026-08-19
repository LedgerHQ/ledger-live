import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import type { Tree } from "@nx/devkit";
import {
  scanRegistry,
  createImportsString,
  createToolsString,
  createDevtoolsConfigArrayString,
  rewriteIndexRegistry,
  type toolMeta,
} from "./generator";

const DEVTOOLS_ROOT = "devtools";
const REGISTRY_META = "devtools/registry/src/metadata";

function mockTool(overrides: Partial<toolMeta> = {}): toolMeta {
  return {
    toolName: "feature-flags",
    team: "platform",
    hasProps: false,
    ...overrides,
  };
}

describe("createImportsString", () => {
  it("produces a namespace import for a single team", () => {
    const result = createImportsString([mockTool()]);
    expect(result).toBe(`import * as platform from "./metadata/platform";\n`);
  });

  it("produces the same single import regardless of whether tools have props", () => {
    const withProps = createImportsString([mockTool({ hasProps: true })]);
    const withoutProps = createImportsString([mockTool({ hasProps: false })]);
    expect(withProps).toBe(withoutProps);
  });

  it("produces one import per team even when multiple tools share a team", () => {
    const tools = [
      mockTool({ toolName: "feature-flags", team: "platform" }),
      mockTool({ toolName: "pay-card", team: "platform" }),
    ];
    const result = createImportsString(tools);
    expect(result.split("\n").filter(Boolean)).toHaveLength(1);
    expect(result).toContain(`from "./metadata/platform"`);
  });

  it("produces one import per team for tools in different teams", () => {
    const tools = [
      mockTool({ toolName: "feature-flags", team: "platform" }),
      mockTool({ toolName: "pay-card", team: "ptx" }),
    ];
    const result = createImportsString(tools);
    expect(result.split("\n").filter(Boolean)).toHaveLength(2);
    expect(result).toContain(`from "./metadata/platform"`);
    expect(result).toContain(`from "./metadata/ptx"`);
  });

  it("camelCases hyphenated team names into a valid identifier", () => {
    const result = createImportsString([mockTool({ team: "wallet-xp" })]);
    expect(result).toContain("import * as walletXp");
  });

  it("returns an empty string for an empty list", () => {
    expect(createImportsString([])).toBe("");
  });
});

describe("createToolsString", () => {
  it("maps tool id to its namespaced property name with indentation", () => {
    const result = createToolsString([mockTool()]);
    expect(result).toContain(`  "feature-flags": platform.featureFlags`);
  });

  it("includes all tools with their team namespace", () => {
    const tools = [
      mockTool({ toolName: "feature-flags", team: "platform" }),
      mockTool({ toolName: "pay-card", team: "ptx" }),
    ];
    const result = createToolsString(tools);
    expect(result).toContain(`  "feature-flags": platform.featureFlags`);
    expect(result).toContain(`  "pay-card": ptx.payCard`);
  });

  it("wraps the map in an exported const", () => {
    const result = createToolsString([mockTool()]);
    expect(result).toMatch(/^export const tools = \{/);
    expect(result).toMatch(/\} as const;$/);
  });
});

describe("createDevtoolsConfigArrayString", () => {
  it("sets config to undefined for a propless tool", () => {
    const result = createDevtoolsConfigArrayString([mockTool()]);
    expect(result).toContain(`| { id: "feature-flags"; config: undefined }`);
  });

  it("sets config to the namespaced props type for a tool with props", () => {
    const result = createDevtoolsConfigArrayString([mockTool({ hasProps: true })]);
    expect(result).toContain(`| { id: "feature-flags"; config: platform.FeatureFlagsToolProps }`);
  });

  it("falls back to never when the list is empty to avoid a syntax error", () => {
    const result = createDevtoolsConfigArrayString([]);
    expect(result).toContain("never;");
    expect(result).not.toMatch(/=\s*$/m);
  });

  it("includes one union member per tool", () => {
    const tools = [
      mockTool({ toolName: "feature-flags", team: "platform" }),
      mockTool({ toolName: "pay-card", team: "ptx", hasProps: true }),
    ];
    const result = createDevtoolsConfigArrayString(tools);
    expect(result).toContain(`| { id: "feature-flags"; config: undefined }`);
    expect(result).toContain(`| { id: "pay-card"; config: ptx.PayCardToolProps }`);
  });
});

describe("scanRegistry", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("returns a tool without props when types.ts is absent", () => {
    tree.write(`${DEVTOOLS_ROOT}/feature-flags/src/index.ts`, "");
    tree.write(`${REGISTRY_META}/platform/feature-flags.ts`, "");

    const { tools, orphans } = scanRegistry(tree);

    expect(tools).toEqual([{ toolName: "feature-flags", team: "platform", hasProps: false }]);
    expect(orphans).toHaveLength(0);
  });

  it("marks hasProps true when types.ts exists", () => {
    tree.write(`${DEVTOOLS_ROOT}/feature-flags/src/types.ts`, "");
    tree.write(`${REGISTRY_META}/platform/feature-flags.ts`, "");

    const { tools } = scanRegistry(tree);

    expect(tools[0].hasProps).toBe(true);
  });

  it("marks a tool as orphan when the package folder is missing", () => {
    tree.write(`${REGISTRY_META}/platform/gone-tool.ts`, "");

    const { orphans, tools } = scanRegistry(tree);

    expect(orphans).toEqual([
      {
        toolName: "gone-tool",
        team: "platform",
        filePath: `${REGISTRY_META}/platform/gone-tool.ts`,
      },
    ]);
    expect(tools).toHaveLength(0);
  });

  it("skips index files", () => {
    tree.write(`${REGISTRY_META}/platform/index.ts`, "export * from './feature-flags';");

    const { tools, orphans } = scanRegistry(tree);

    expect(tools).toHaveLength(0);
    expect(orphans).toHaveLength(0);
  });

  it("scans tools across multiple teams", () => {
    tree.write(`${DEVTOOLS_ROOT}/feature-flags/src/index.ts`, "");
    tree.write(`${DEVTOOLS_ROOT}/pay-card/src/index.ts`, "");
    tree.write(`${REGISTRY_META}/platform/feature-flags.ts`, "");
    tree.write(`${REGISTRY_META}/ptx/pay-card.ts`, "");

    const { tools } = scanRegistry(tree);

    expect(tools).toHaveLength(2);
    expect(tools.find(t => t.toolName === "feature-flags")?.team).toBe("platform");
    expect(tools.find(t => t.toolName === "pay-card")?.team).toBe("ptx");
  });
});

describe("rewriteIndexRegistry", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("writes a team index and the metadata root index", () => {
    rewriteIndexRegistry(tree, [mockTool()]);

    expect(tree.read(`${REGISTRY_META}/platform/index.ts`, "utf-8")).toContain(
      `export * from "./feature-flags"`,
    );
    expect(tree.read(`${REGISTRY_META}/index.ts`, "utf-8")).toContain(`export * from "./platform"`);
  });

  it("removes a stale team index when that team has no remaining tools", () => {
    tree.write(`${REGISTRY_META}/empty-team/index.ts`, "export * from './gone';");

    rewriteIndexRegistry(tree, [mockTool()]);

    expect(tree.exists(`${REGISTRY_META}/empty-team/index.ts`)).toBe(false);
  });

  it("rebuilds a team index from scratch, removing stale exports", () => {
    tree.write(`${REGISTRY_META}/platform/index.ts`, "export * from './stale-tool';");

    rewriteIndexRegistry(tree, [mockTool()]);

    const content = tree.read(`${REGISTRY_META}/platform/index.ts`, "utf-8")!;
    expect(content).not.toContain("stale-tool");
    expect(content).toContain("feature-flags");
  });

  it("writes one entry per team in the root metadata index", () => {
    const tools = [
      mockTool({ toolName: "feature-flags", team: "platform" }),
      mockTool({ toolName: "pay-card", team: "ptx" }),
    ];
    rewriteIndexRegistry(tree, tools);

    const root = tree.read(`${REGISTRY_META}/index.ts`, "utf-8")!;
    expect(root).toContain(`export * from "./platform"`);
    expect(root).toContain(`export * from "./ptx"`);
  });
});

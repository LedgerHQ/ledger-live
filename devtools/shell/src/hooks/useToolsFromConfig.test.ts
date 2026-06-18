import { renderHook } from "@testing-library/react";
import { Category } from "@devtools/registry";
import { useToolsFromConfig } from "./useToolsFromConfig";
import { mockDevToolsConfig } from "../../jest/test-utils";

jest.mock("@devtools/registry", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual("@devtools/registry");
  return {
    ...actual,
    tools: {
      "native-tool": {
        label: "Native Tool",
        category: actual.Category.CONFIGURATION,
        platform: "native",
        loader: () => Promise.resolve({ default: () => null }),
      },
      "web-tool": {
        label: "Web Tool",
        category: actual.Category.CONFIGURATION,
        platform: "web",
        loader: () => Promise.resolve({ default: () => null }),
      },
      "shared-tool": {
        label: "Shared Tool",
        category: actual.Category.DEBUGGING,
        loader: () => Promise.resolve({ default: () => null }),
      },
    },
  };
});

const config = mockDevToolsConfig([
  { id: "native-tool", config: {} },
  { id: "web-tool", config: {} },
  { id: "shared-tool", config: {} },
]);

describe("useToolsFromConfig", () => {
  it("groups platform-matching tools into their categories", () => {
    const { result } = renderHook(() => useToolsFromConfig(config, "native"));
    const categories = result.current.categories.map(c => c.category);
    expect(categories).toEqual([Category.CONFIGURATION, Category.DEBUGGING]);
  });

  it("drops tools that don't target the platform", () => {
    const { result } = renderHook(() => useToolsFromConfig(config, "native"));
    const ids = result.current.categories.flatMap(c => c.tools.map(t => t.id));
    expect(ids).toEqual(["native-tool", "shared-tool"]);
  });

  it("attaches the lazily loaded component to each resolved tool", () => {
    const { result } = renderHook(() => useToolsFromConfig(config, "native"));
    const tools = result.current.categories.flatMap(c => c.tools);
    expect(tools.every(t => t.component != null)).toBe(true);
  });

  it("throws for an unknown tool id", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const unknown = mockDevToolsConfig([{ id: "does-not-exist", config: {} }]);
    expect(() => renderHook(() => useToolsFromConfig(unknown, "native"))).toThrow(
      'Unknown devtools tool id: "does-not-exist"',
    );
    spy.mockRestore();
  });
});

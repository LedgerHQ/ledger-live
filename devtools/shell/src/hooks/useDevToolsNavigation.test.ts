import { act, renderHook } from "@testing-library/react";
import { useDevToolsNavigation } from "./useDevToolsNavigation";
import { Category } from "../types";
import { makeTool } from "../../jest/fixtures";

const tools = [
  makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
  makeTool({ id: "another-tool", label: "Another Tool", category: Category.CONFIGURATION }),
  makeTool({ id: "network-inspector", label: "Network Inspector", category: Category.CONNECTIVITY }),
];

describe("useDevToolsNavigation", () => {
  it("only includes categories that have at least one tool", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const categories = result.current.categories.map(c => c.category);
    expect(categories).toEqual([Category.CONFIGURATION, Category.CONNECTIVITY]);
  });

  it("groups tools under the correct category", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const config = result.current.categories.find(c => c.category === Category.CONFIGURATION);
    expect(config?.tools).toHaveLength(2);
    expect(config?.tools.map(t => t.label)).toEqual(["Feature Flags", "Another Tool"]);
  });

  it("excludes categories with no tools", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const generators = result.current.categories.find(c => c.category === Category.GENERATORS);
    expect(generators).toBeUndefined();
  });

  it("starts with no active tool", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    expect(result.current.activeToolId).toBeNull();
    expect(result.current.activeTool).toBeNull();
  });

  it("updates activeToolId and derives activeTool via setActiveToolId", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    act(() => result.current.setActiveToolId("feature-flags"));
    expect(result.current.activeToolId).toBe("feature-flags");
    expect(result.current.activeTool).toBe(tools[0]);
  });

  it("activeTool is null for an unknown id", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    act(() => result.current.setActiveToolId("does-not-exist"));
    expect(result.current.activeTool).toBeNull();
  });
});

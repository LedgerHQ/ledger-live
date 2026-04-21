import { act, renderHook } from "@testing-library/react";
import { useDevToolsNavigation } from "../../hooks/useDevToolsNavigation";
import { Category, type Tool } from "../../types";

const tools: Tool[] = [
  { id: "feature-flags", label: "Feature Flags", category: Category.DEV_TOOLS },
  { id: "another-dev-tool", label: "Another Dev Tool", category: Category.DEV_TOOLS },
  { id: "network-inspector", label: "Network Inspector", category: Category.NETWORK },
];

describe("useDevToolsNavigation", () => {
  it("includes all Category enum values, even empty ones", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const categories = result.current.categories.map(c => c.category);
    expect(categories).toEqual(Object.values(Category));
  });

  it("groups tools under the correct category", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const devTools = result.current.categories.find(c => c.category === Category.DEV_TOOLS);
    expect(devTools?.tools).toHaveLength(2);
    expect(devTools?.tools.map(t => t.label)).toEqual(["Feature Flags", "Another Dev Tool"]);
  });

  it("returns an empty tools array for categories with no tools", () => {
    const { result } = renderHook(() => useDevToolsNavigation(tools));
    const device = result.current.categories.find(c => c.category === Category.DEVICE);
    expect(device?.tools).toHaveLength(0);
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

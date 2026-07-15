import { renderHook } from "jest/render.native";
import type { SortCategory, SortDirection } from "../../hooks";
import { useSortButtonViewModel } from "./useSortButtonViewModel.native";

function input(category: SortCategory, direction: SortDirection, setSort = jest.fn()) {
  return { category, direction, setSort };
}

describe("useSortButtonViewModel", () => {
  it("marks only the option matching the current sort as active", () => {
    const { result } = renderHook(() => useSortButtonViewModel(input("enabled", "asc")));
    const active = result.current.options.filter(option => option.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe("Enabled first");
  });

  it("uses the active option's label as the active label", () => {
    const { result } = renderHook(() => useSortButtonViewModel(input("overridden", "desc")));
    expect(result.current.activeLabel).toBe("Overridden last");
  });

  it("applies the selected category and direction", () => {
    const setSort = jest.fn();
    const { result } = renderHook(() => useSortButtonViewModel(input("name", "asc", setSort)));
    result.current.select({ category: "enabled", direction: "desc", label: "Enabled last" });
    expect(setSort).toHaveBeenCalledWith("enabled", "desc");
  });
});

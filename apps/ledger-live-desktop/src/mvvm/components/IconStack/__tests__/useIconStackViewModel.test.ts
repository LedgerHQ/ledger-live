import { renderHook } from "tests/testSetup";
import { useIconStackViewModel } from "../hooks/useIconStackViewModel";

describe("useIconStackViewModel", () => {
  it("computes visible items, overflow count, and tooltip content", () => {
    const items = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
      { id: "e", label: "E" },
      { id: "f", label: "F" },
    ];

    const { result } = renderHook(() =>
      useIconStackViewModel({
        items,
        size: 20,
        getTooltipContent: allItems => allItems.map(item => item.label).join(", "),
      }),
    );

    expect(result.current.visibleItems).toHaveLength(3);
    expect(result.current.hasOverflowBadge).toBe(true);
    expect(result.current.displayedOverflowCount).toBe(3);
    expect(result.current.tooltipContent).toBe("A, B, C, D, E, F");
  });
});

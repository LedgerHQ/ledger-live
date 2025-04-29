import { renderHook } from "@tests/test-renderer";
import { useCardRotation } from "../useCardRotation";

describe("useCardRotation", () => {
  const cards = [
    { id: 1, name: "Card 1" },
    { id: 2, name: "Card 2" },
    { id: 3, name: "Card 3" },
    { id: 4, name: "Card 4" },
  ];

  it("should return the cards in the original order when cardIndex is 0", () => {
    const { result } = renderHook(() => useCardRotation(0, cards));
    expect(result.current).toEqual(cards);
  });

  it("should rotate the cards correctly when cardIndex is 1", () => {
    const { result } = renderHook(() => useCardRotation(1, cards));
    expect(result.current).toEqual([
      { id: 2, name: "Card 2" },
      { id: 3, name: "Card 3" },
      { id: 4, name: "Card 4" },
      { id: 1, name: "Card 1" },
    ]);
  });

  it("should rotate the cards correctly when cardIndex is 2", () => {
    const { result } = renderHook(() => useCardRotation(2, cards));
    expect(result.current).toEqual([
      { id: 3, name: "Card 3" },
      { id: 4, name: "Card 4" },
      { id: 1, name: "Card 1" },
      { id: 2, name: "Card 2" },
    ]);
  });

  it("should rotate the cards correctly when cardIndex is equal to the length of the cards array", () => {
    const { result } = renderHook(() => useCardRotation(cards.length, cards));
    expect(result.current).toEqual(cards);
  });

  it("should handle an empty cards array", () => {
    const { result } = renderHook(() => useCardRotation(0, []));
    expect(result.current).toEqual([]);
  });
});

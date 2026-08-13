import { renderHook } from "@testing-library/react";
import { useActionTilesViewModel } from "../useActionTilesViewModel";
import type { ActionTile, ActionTilesProps } from "../types";

const deposit: ActionTile = { id: "deposit", label: "Deposit", onPress: jest.fn() };
const request: ActionTile = { id: "request", label: "Request", onPress: jest.fn() };

function buildProps(overrides: Partial<ActionTilesProps> = {}): ActionTilesProps {
  return { tiles: [deposit, request], page: "Pay", ...overrides };
}

describe("useActionTilesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fire tracking then call the original handler on press", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderHook(() => useActionTilesViewModel(buildProps({ onTrackEvent })));

    result.current.tiles[0].onPress();

    expect(onTrackEvent).toHaveBeenCalledTimes(1);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "deposit",
      buttonLocation: "quick_action",
      page: "Pay",
    });
    expect(deposit.onPress).toHaveBeenCalledTimes(1);
  });

  it("should fire tracking with the correct button id per tile", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderHook(() => useActionTilesViewModel(buildProps({ onTrackEvent })));

    result.current.tiles[1].onPress();

    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "request",
      buttonLocation: "quick_action",
      page: "Pay",
    });
  });

  it("should not throw when onTrackEvent is absent", () => {
    const { result } = renderHook(() => useActionTilesViewModel(buildProps()));

    expect(() => result.current.tiles[0].onPress()).not.toThrow();
    expect(deposit.onPress).toHaveBeenCalledTimes(1);
  });

  it("should expose all input tiles in the output", () => {
    const pay: ActionTile = { id: "pay", label: "New payment", onPress: jest.fn() };
    const { result } = renderHook(() =>
      useActionTilesViewModel(buildProps({ tiles: [deposit, request, pay] })),
    );

    expect(result.current.tiles).toHaveLength(3);
    expect(result.current.tiles.map(t => t.id)).toEqual(["deposit", "request", "pay"]);
  });
});

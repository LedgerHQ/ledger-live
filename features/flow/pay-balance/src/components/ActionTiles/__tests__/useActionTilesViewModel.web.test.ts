import { renderHook } from "@testing-library/react";
import { useActionTilesViewModel } from "../useActionTilesViewModel";
import type { ActionTileInput, ActionTilesProps } from "../types";
import { i18nWrapper } from "../../../__tests__/i18nWrapper";

const deposit: ActionTileInput = {
  id: "deposit",
  onPress: jest.fn(),
  appearance: "base",
};
const request: ActionTileInput = {
  id: "request",
  onPress: jest.fn(),
  appearance: "transparent",
};

function buildProps(overrides: Partial<ActionTilesProps> = {}): ActionTilesProps {
  return { tiles: [deposit, request], page: "Pay", ...overrides };
}

function renderActionTilesViewModel(
  props: ActionTilesProps,
  resources?: Parameters<typeof i18nWrapper>[0],
) {
  return renderHook(() => useActionTilesViewModel(props), { wrapper: i18nWrapper(resources) });
}

describe("useActionTilesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fire tracking then call the original handler on press", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderActionTilesViewModel(buildProps({ onTrackEvent }));

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
    const { result } = renderActionTilesViewModel(buildProps({ onTrackEvent }));

    result.current.tiles[1].onPress();

    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "request",
      buttonLocation: "quick_action",
      page: "Pay",
    });
  });

  it("should not throw when onTrackEvent is absent", () => {
    const { result } = renderActionTilesViewModel(buildProps());

    expect(() => result.current.tiles[0].onPress()).not.toThrow();
    expect(deposit.onPress).toHaveBeenCalledTimes(1);
  });

  it("should expose all input tiles in the output", () => {
    const pay: ActionTileInput = {
      id: "pay",
      onPress: jest.fn(),
      appearance: "transparent",
    };
    const { result } = renderActionTilesViewModel(buildProps({ tiles: [deposit, request, pay] }));

    expect(result.current.tiles).toHaveLength(3);
    expect(result.current.tiles.map(t => t.id)).toEqual(["deposit", "request", "pay"]);
  });

  it("should resolve each tile label from the mounted i18n provider", () => {
    const { result } = renderActionTilesViewModel(buildProps(), {
      en: {
        translation: { payTab: { actions: { deposit: "Add stablecoin", request: "Request" } } },
      },
    });

    expect(result.current.tiles.map(t => t.label)).toEqual(["Add stablecoin", "Request"]);
  });
});

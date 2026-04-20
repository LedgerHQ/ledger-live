import { renderHook } from "@tests/test-renderer";
import { InteractionManager } from "react-native";
import { useHubDrawerPresentation } from "../hooks/useHubDrawerPresentation";

type BottomSheetRefObject = Parameters<typeof useHubDrawerPresentation>[0];

describe("useHubDrawerPresentation", () => {
  const present = jest.fn();
  const dismiss = jest.fn();
  const bottomSheetRef = { current: { present, dismiss } } as unknown as BottomSheetRefObject;
  let runAfterInteractionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation(task => {
        if (typeof task === "function") task();
        else if (task && "run" in task && typeof task.run === "function") task.run();
        return { cancel: jest.fn() } as never;
      });
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
  });

  it("should dismiss the bottom sheet when isOpen is false", () => {
    renderHook(() => useHubDrawerPresentation(bottomSheetRef, false));
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(present).not.toHaveBeenCalled();
  });

  it("should present the bottom sheet when isOpen becomes true", () => {
    renderHook(() => useHubDrawerPresentation(bottomSheetRef, true));
    expect(present).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it("should toggle between present and dismiss when isOpen changes", () => {
    let isOpen = false;
    const { rerender } = renderHook(() => useHubDrawerPresentation(bottomSheetRef, isOpen));
    expect(dismiss).toHaveBeenCalledTimes(1);

    isOpen = true;
    rerender({});
    expect(present).toHaveBeenCalledTimes(1);

    isOpen = false;
    rerender({});
    expect(dismiss).toHaveBeenCalledTimes(2);
  });
});

import { act, renderHook } from "@tests/test-renderer";
import { Keyboard, type KeyboardEvent } from "react-native";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "./keyboardVisible";

describe("shouldUseKeyboardAvoidance", () => {
  it("should enable JavaScript keyboard avoidance on iOS and Android 35+", () => {
    expect(shouldUseKeyboardAvoidance("ios", "18.0")).toBe(true);
    expect(shouldUseKeyboardAvoidance("android", 35)).toBe(true);
  });

  it("should keep native Android resize below API 35", () => {
    expect(shouldUseKeyboardAvoidance("android", 34)).toBe(false);
  });
});

describe("useKeyboardVisible", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should synchronize with keyboard will events when requested", () => {
    const listeners = new Map<string, (event: KeyboardEvent) => void>();
    const removeShowListener = jest.fn();
    const removeHideListener = jest.fn();
    const addListener = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation((event, listener) => {
        listeners.set(event, listener);
        return {
          remove: event === "keyboardWillShow" ? removeShowListener : removeHideListener,
        } as unknown as ReturnType<typeof Keyboard.addListener>;
      });
    const { result, unmount } = renderHook(() => useKeyboardVisible({ eventTiming: "will" }));

    act(() => {
      listeners.get("keyboardWillShow")?.({ endCoordinates: { height: 320 } } as KeyboardEvent);
    });

    expect(result.current).toEqual({ isKeyboardVisible: true, keyboardHeight: 320 });

    act(() => {
      listeners.get("keyboardWillHide")?.({} as KeyboardEvent);
    });

    expect(result.current).toEqual({ isKeyboardVisible: false, keyboardHeight: 0 });

    unmount();

    expect(removeShowListener).toHaveBeenCalledTimes(1);
    expect(removeHideListener).toHaveBeenCalledTimes(1);
    expect(addListener).toHaveBeenCalledWith("keyboardWillShow", expect.any(Function));
    expect(addListener).toHaveBeenCalledWith("keyboardWillHide", expect.any(Function));
  });

  it("should synchronize with keyboard did events by default", () => {
    const addListener = jest.spyOn(Keyboard, "addListener").mockImplementation(
      () =>
        ({
          remove: jest.fn(),
        }) as unknown as ReturnType<typeof Keyboard.addListener>,
    );

    const { unmount } = renderHook(() => useKeyboardVisible());

    expect(addListener).toHaveBeenCalledWith("keyboardDidShow", expect.any(Function));
    expect(addListener).toHaveBeenCalledWith("keyboardDidHide", expect.any(Function));

    unmount();
  });
});

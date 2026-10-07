import { act, renderHook } from "@testing-library/react-native";
import { Keyboard, type View } from "react-native";
import { useKeyboardOverlap } from "./useKeyboardOverlap.native";

type KeyboardListener = (event: { endCoordinates: { screenY: number } }) => void;

const containerInWindow = { y: 120, height: 600 };

const setUpKeyboard = (visibleKeyboardTop?: number) => {
  const listeners = new Map<string, KeyboardListener>();
  Object.assign(Keyboard, {
    metrics: () =>
      visibleKeyboardTop === undefined
        ? undefined
        : { screenX: 0, screenY: visibleKeyboardTop, width: 375, height: 300 },
    addListener: (eventName: string, listener: KeyboardListener) => {
      listeners.set(eventName, listener);
      return { remove: () => listeners.delete(eventName) };
    },
  });
  return listeners;
};

const renderKeyboardOverlap = () => {
  const { result, unmount } = renderHook(() => useKeyboardOverlap());
  const container: Partial<View> = {
    measureInWindow: callback => callback(0, containerInWindow.y, 375, containerInWindow.height),
  };
  Object.assign(result.current.containerRef, { current: container });
  return { result, unmount };
};

describe("useKeyboardOverlap", () => {
  it("leaves the container untouched while no keyboard is up", () => {
    setUpKeyboard();
    const { result } = renderKeyboardOverlap();

    act(() => result.current.onContainerLayout());

    expect(result.current.keyboardOverlap).toBe(0);
  });

  it("measures the keyboard already up when the container lays out", () => {
    setUpKeyboard(520);
    const { result } = renderKeyboardOverlap();

    act(() => result.current.onContainerLayout());

    expect(result.current.keyboardOverlap).toBe(200);
  });

  it("follows the keyboard as it shows and hides", () => {
    const listeners = setUpKeyboard();
    const { result } = renderKeyboardOverlap();

    act(() => listeners.get("keyboardWillShow")?.({ endCoordinates: { screenY: 420 } }));
    expect(result.current.keyboardOverlap).toBe(300);

    act(() => listeners.get("keyboardWillHide")?.({ endCoordinates: { screenY: 812 } }));
    expect(result.current.keyboardOverlap).toBe(0);
  });

  it("ignores a keyboard that ends below the container", () => {
    setUpKeyboard(760);
    const { result } = renderKeyboardOverlap();

    act(() => result.current.onContainerLayout());

    expect(result.current.keyboardOverlap).toBe(0);
  });

  it("stops listening once unmounted", () => {
    const listeners = setUpKeyboard();
    const { unmount } = renderKeyboardOverlap();

    unmount();

    expect(listeners.size).toBe(0);
  });
});

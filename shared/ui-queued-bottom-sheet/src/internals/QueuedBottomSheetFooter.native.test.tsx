import React from "react";
import {
  Keyboard,
  Platform,
  View,
  type KeyboardEvent,
  type KeyboardEventName,
  type KeyboardMetrics,
} from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { QueuedBottomSheetFooter } from "./QueuedBottomSheetFooter.native";

const KEYBOARD_SHOWN = 1;

let gorhomKeyboard: { status: number; heightWithinContainer: number } | null = null;
let keyboardMetrics: KeyboardMetrics | undefined;

jest.mock("@gorhom/bottom-sheet", () => ({
  KEYBOARD_STATUS: { UNDETERMINED: 0, SHOWN: 1, HIDDEN: 2 },
  useBottomSheetInternal: () =>
    gorhomKeyboard === null ? null : { animatedKeyboardState: { get: () => gorhomKeyboard } },
}));

const BOTTOM_INSET = 48;

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: BOTTOM_INSET, left: 0, right: 0 }),
}));

describe("QueuedBottomSheetFooter (native)", () => {
  const originalOS = Platform.OS;
  const listeners = new Map<string, (event: KeyboardEvent) => void>();

  beforeEach(() => {
    listeners.clear();
    gorhomKeyboard = null;
    keyboardMetrics = undefined;
    Keyboard.metrics = () => keyboardMetrics;
    jest.spyOn(Keyboard, "addListener").mockImplementation(((
      event: KeyboardEventName,
      listener: (event: KeyboardEvent) => void,
    ) => {
      listeners.set(event, listener);
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("reports its measured height so the sheet content can reserve room for it", () => {
    const onHeightChange = jest.fn();

    render(
      <QueuedBottomSheetFooter onHeightChange={onHeightChange}>
        <View testID="footer-action" />
      </QueuedBottomSheetFooter>,
    );

    const [measuredView] = screen.UNSAFE_getAllByType(View);
    fireEvent(measuredView, "layout", { nativeEvent: { layout: { height: 96 } } });

    expect(onHeightChange).toHaveBeenCalledWith(96);
  });

  it("rises over the Android keyboard, which gorhom leaves to the window there", () => {
    Platform.OS = "android";
    renderFooter();

    expect(footerTranslateY()).toBe(0);

    showKeyboard(320);
    expect(footerTranslateY()).toBe(-320);

    hideKeyboard();
    expect(footerTranslateY()).toBe(0);
  });

  // Android reports a keyboard height that stops short of the system bars, so dropping the safe
  // area while the keyboard is up would leave the action half behind it.
  it("keeps its bottom safe area while the Android keyboard is up", () => {
    Platform.OS = "android";
    renderFooter();

    showKeyboard(320);

    expect(footerPaddingBottom()).toBeGreaterThanOrEqual(BOTTOM_INSET);
  });

  it("stays put on iOS while the keyboard is closed", () => {
    Platform.OS = "ios";
    renderFooter();

    expect(footerTranslateY()).toBe(0);
  });

  it("rises on iOS over a keyboard gorhom never offset", () => {
    Platform.OS = "ios";
    keyboardMetrics = { height: 320, screenX: 0, screenY: 0, width: 390 };
    renderFooter();

    expect(footerTranslateY()).toBe(-320);
  });

  it("keeps the iOS footer down when the keyboard hides during sampling", () => {
    Platform.OS = "ios";
    keyboardMetrics = { height: 320, screenX: 0, screenY: 0, width: 390 };
    const pending: Array<(time: number) => void> = [];
    const runtime = globalThis as unknown as {
      requestAnimationFrame: (callback: (time: number) => void) => number;
    };
    const originalFrame = runtime.requestAnimationFrame;
    runtime.requestAnimationFrame = callback => {
      pending.push(callback);
      return pending.length;
    };

    try {
      renderFooter();
      expect(footerTranslateY()).toBe(-320);

      act(() => {
        listeners.get("keyboardWillHide")?.({ endCoordinates: { height: 0 } } as KeyboardEvent);
      });
      act(() => {
        pending.splice(0).forEach(callback => callback(0));
      });

      expect(footerTranslateY()).toBe(0);
    } finally {
      runtime.requestAnimationFrame = originalFrame;
    }
  });

  it("leaves an iOS keyboard gorhom already cleared alone", () => {
    Platform.OS = "ios";
    keyboardMetrics = { height: 320, screenX: 0, screenY: 0, width: 390 };
    gorhomKeyboard = { status: KEYBOARD_SHOWN, heightWithinContainer: 320 };
    renderFooter();

    expect(footerTranslateY()).toBe(0);
  });

  it("closes only the iOS gap gorhom left", () => {
    Platform.OS = "ios";
    keyboardMetrics = { height: 320, screenX: 0, screenY: 0, width: 390 };
    gorhomKeyboard = { status: KEYBOARD_SHOWN, heightWithinContainer: 100 };
    renderFooter();

    expect(footerTranslateY()).toBe(-220);
  });

  function showKeyboard(height: number) {
    act(() => {
      listeners.get("keyboardDidShow")?.({ endCoordinates: { height } } as KeyboardEvent);
    });
  }

  function hideKeyboard() {
    act(() => {
      listeners.get("keyboardDidHide")?.({ endCoordinates: { height: 0 } } as KeyboardEvent);
    });
  }
});

function renderFooter() {
  return render(
    <QueuedBottomSheetFooter onHeightChange={jest.fn()}>
      <View testID="footer-action" />
    </QueuedBottomSheetFooter>,
  );
}

function footerTranslateY(): number {
  const [lifted] = screen.UNSAFE_getAllByType(View);
  return lifted.props.style.transform[0].translateY;
}

function footerPaddingBottom(): number {
  return screen.getByTestId("footer-action").parent!.props.style.paddingBottom;
}

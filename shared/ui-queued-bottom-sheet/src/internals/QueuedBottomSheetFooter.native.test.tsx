import React from "react";
import { Keyboard, Platform, View, type KeyboardEvent, type KeyboardEventName } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { QueuedBottomSheetFooter } from "./QueuedBottomSheetFooter.native";

const BOTTOM_INSET = 48;

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: BOTTOM_INSET, left: 0, right: 0 }),
}));

describe("QueuedBottomSheetFooter (native)", () => {
  const originalOS = Platform.OS;
  const listeners = new Map<string, (event: KeyboardEvent) => void>();

  beforeEach(() => {
    listeners.clear();
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

  it("stays put on iOS, where gorhom already offsets the keyboard", () => {
    Platform.OS = "ios";
    renderFooter();

    expect(listeners.size).toBe(0);
    expect(footerTranslateY()).toBe(0);
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

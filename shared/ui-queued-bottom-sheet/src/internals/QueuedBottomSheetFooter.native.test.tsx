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

let keyboardMetrics: KeyboardMetrics | undefined;
const footerOnScreen = { y: 0, width: 390, height: 80 };
const KEYBOARD_TOP = 500;

jest.mock("react-native", () => {
  const ReactActual = require("react");
  const actual = jest.requireActual("react-native");
  const MockView = ReactActual.forwardRef(
    (
      props: { children?: React.ReactNode },
      ref: React.Ref<{
        measureInWindow: (
          callback: (x: number, y: number, width: number, height: number) => void,
        ) => void;
      }>,
    ) => {
      ReactActual.useImperativeHandle(ref, () => ({
        measureInWindow: (
          callback: (x: number, y: number, width: number, height: number) => void,
        ) => {
          callback(0, footerOnScreen.y, footerOnScreen.width, footerOnScreen.height);
        },
      }));
      return ReactActual.createElement(actual.View, props);
    },
  );

  return { ...actual, View: MockView };
});

const BOTTOM_INSET = 48;

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: BOTTOM_INSET, left: 0, right: 0 }),
}));

describe("QueuedBottomSheetFooter (native)", () => {
  const originalOS = Platform.OS;
  const listeners = new Map<string, (event: KeyboardEvent) => void>();

  beforeEach(() => {
    listeners.clear();
    keyboardMetrics = undefined;
    footerOnScreen.y = 0;
    footerOnScreen.height = 80;
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

  it("lifts an iOS footer by the amount still overlapping the keyboard", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 740;
    keyboardMetrics = openKeyboard();
    renderFooter();

    expect(footerTranslateY()).toBe(-320);
  });

  it("stays put on iOS when the footer already sits on the keyboard", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 420;
    keyboardMetrics = openKeyboard();
    renderFooter();

    expect(footerTranslateY()).toBe(0);
  });

  it("stays put on iOS when the footer is already clear of an open keyboard", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 320;
    keyboardMetrics = openKeyboard();
    renderFooter();

    expect(footerTranslateY()).toBe(0);
  });

  it("corrects the iOS lift on a later frame when the keyboard is already open", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 740;
    keyboardMetrics = openKeyboard();
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

      footerOnScreen.y = 420;
      act(() => {
        pending.splice(0).forEach(callback => callback(0));
      });

      expect(footerTranslateY()).toBe(0);
    } finally {
      runtime.requestAnimationFrame = originalFrame;
    }
  });

  it("drops the extra iOS lift after the sheet moves the footer up", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 740;
    renderFooter();

    act(() => {
      listeners.get("keyboardWillShow")?.(keyboardEvent());
    });
    expect(footerTranslateY()).toBe(-320);

    footerOnScreen.y = 420;
    act(() => {
      listeners.get("keyboardDidShow")?.(keyboardEvent());
    });

    expect(footerTranslateY()).toBe(0);
  });

  it("keeps the iOS footer down when the keyboard hides during sampling", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 740;
    keyboardMetrics = openKeyboard();
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

  it("rises on iOS when the keyboard opens after the sheet mounted", () => {
    Platform.OS = "ios";
    footerOnScreen.y = 740;
    renderFooter();

    expect(footerTranslateY()).toBe(0);

    act(() => {
      listeners.get("keyboardDidShow")?.(keyboardEvent());
    });

    expect(footerTranslateY()).toBe(-320);
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

function openKeyboard(): KeyboardMetrics {
  return { height: 320, screenX: 0, screenY: KEYBOARD_TOP, width: 390 };
}

function keyboardEvent(): KeyboardEvent {
  return { endCoordinates: openKeyboard() } as KeyboardEvent;
}

function renderFooter() {
  return render(
    <QueuedBottomSheetFooter onHeightChange={jest.fn()}>
      <View testID="footer-action" />
    </QueuedBottomSheetFooter>,
  );
}

function footerTranslateY(): number {
  const lifted = screen
    .UNSAFE_getAllByType(View)
    .find(view => view.props.style?.transform?.[0]?.translateY !== undefined);
  return lifted?.props.style.transform[0].translateY;
}

function footerPaddingBottom(): number {
  let node: { props: { style?: unknown }; parent: typeof node | null } | null =
    screen.getByTestId("footer-action");
  while (node) {
    const padding = paddingBottom(node.props.style);
    if (padding !== undefined) return padding;
    node = node.parent;
  }
  throw new Error("footer padding was not rendered");
}

function paddingBottom(style: unknown): number | undefined {
  if (Array.isArray(style)) {
    return style.map(paddingBottom).find(value => value !== undefined);
  }
  if (style && typeof style === "object" && "paddingBottom" in style) {
    const value = style.paddingBottom;
    return typeof value === "number" ? value : undefined;
  }
  return undefined;
}

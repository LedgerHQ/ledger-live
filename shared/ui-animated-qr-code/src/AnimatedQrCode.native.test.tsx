import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { runFrame, setReducedMotion } from "../jest/mocks/react-native-reanimated";
import { AnimatedQrCode } from "./index";
import { createQrMatrix } from "./qrMatrix";
import type { AnimatedQrCodeProps } from "./types";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const NATIVE_VIEW = "SharedAnimatedQrCodeView";
const TEST_ID = "qr";

type Style = Readonly<{ opacity?: number; transform?: ReadonlyArray<{ scale: number }> }>;

function renderQrCode(props: Partial<AnimatedQrCodeProps> = {}) {
  const defaults: AnimatedQrCodeProps = {
    value: ADDRESS,
    size: 200,
    animation: "copy",
    testID: TEST_ID,
    centerContent: <Text>Icon</Text>,
  };
  const view = render(<AnimatedQrCode {...defaults} {...props} />);
  const rerender = (next: Partial<AnimatedQrCodeProps>) =>
    view.rerender(<AnimatedQrCode {...defaults} {...props} {...next} />);
  return { ...view, rerender };
}

const hostsNamed = (name: string) =>
  screen.UNSAFE_root.findAll((node: { type: unknown }) => node.type === name);

const nativeView = () => hostsNamed(NATIVE_VIEW)[0];

// The badge: the animated view that holds the center content.
function badgeStyle(): Style {
  const style = screen.getByText("Icon").parent?.props.style;
  return Object.assign({}, ...[style].flat(2));
}

// The skeleton disc shown in place of the badge while loading.
function placeholderStyle(): Style & { backgroundColor?: string } {
  const [placeholder] = hostsNamed("Animated.View");
  return Object.assign({}, ...[placeholder.props.style].flat(2));
}

afterEach(() => setReducedMotion(false));

describe("AnimatedQrCode", () => {
  it("sends the QR matrix to the native view as flat row and column pairs", () => {
    renderQrCode();
    const matrix = createQrMatrix(ADDRESS);

    expect(nativeView().props).toMatchObject({
      animation: "copy",
      animated: true,
      pressCount: 0,
      moduleCount: matrix.moduleCount,
      dots: matrix.dots.flatMap(({ row, col }) => [row, col]),
      style: { width: 200, height: 200 },
    });
  });

  it("shows the center content", () => {
    renderQrCode();

    expect(screen.getByText("Icon")).toBeOnTheScreen();
    expect(badgeStyle().opacity).toBe(1);
  });

  it("calls onPress on a tap", () => {
    const onPress = jest.fn();
    renderQrCode({ onPress });

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is a button for screen readers when pressable", () => {
    renderQrCode({ onPress: jest.fn(), accessibilityLabel: "Copy address" });

    expect(screen.getByRole("button", { name: "Copy address" })).toBeOnTheScreen();
  });

  it("is not focusable without onPress", () => {
    renderQrCode();

    expect(screen.getByTestId(TEST_ID).props).toMatchObject({ accessible: false });
    expect(screen.queryByRole("button")).toBeNull();
  });

  // Animated styles are computed at render in tests: a re-render shows the frame reached.
  it("pops the badge when pressed", () => {
    const { rerender } = renderQrCode({ onPress: jest.fn() });
    runFrame(1000);
    runFrame(2000);

    fireEvent(screen.getByTestId(TEST_ID), "pressIn");
    runFrame(2150);
    rerender({});

    expect(badgeStyle().transform?.[0].scale).toBeGreaterThan(1.1);
  });

  it("pops the badge and tells the native view when the trigger key changes", () => {
    const { rerender } = renderQrCode({ triggerKey: 3 });
    runFrame(1000);
    runFrame(2000);

    act(() => rerender({ triggerKey: 4 }));
    runFrame(2150);
    rerender({ triggerKey: 4 });

    expect(nativeView().props.pressCount).toBe(1);
    expect(badgeStyle().transform?.[0].scale).toBeGreaterThan(1.1);
  });

  it("shows a skeleton disc instead of the badge while loading", () => {
    renderQrCode({ animation: "loading" });

    expect(nativeView().props.animation).toBe("loading");
    expect(badgeStyle().opacity).toBe(0);
    expect(placeholderStyle()).toMatchObject({ opacity: 1, backgroundColor: "rgb(233,233,233)" });
  });

  it("hides the skeleton disc once loaded", () => {
    renderQrCode();

    expect(placeholderStyle().opacity).toBe(0);
  });

  describe("with reduced motion", () => {
    beforeEach(() => setReducedMotion(true));

    it("draws the code still", () => {
      renderQrCode();

      expect(nativeView().props.animated).toBe(false);
    });

    it("keeps the badge still on press and on trigger", () => {
      const { rerender } = renderQrCode({ onPress: jest.fn() });
      runFrame(1000);
      runFrame(1100);

      fireEvent(screen.getByTestId(TEST_ID), "pressIn");
      act(() => rerender({ triggerKey: 1 }));
      runFrame(1200);
      rerender({ triggerKey: 1 });

      expect(badgeStyle().transform?.[0].scale).toBe(1);
      expect(nativeView().props.pressCount).toBe(0);
    });

    it("keeps the loading skeleton without the shimmer", () => {
      const { rerender } = renderQrCode({ animation: "loading" });
      runFrame(1000);
      runFrame(1300);
      rerender({});

      expect(placeholderStyle().backgroundColor).toBe("rgb(233,233,233)");
    });
  });
});

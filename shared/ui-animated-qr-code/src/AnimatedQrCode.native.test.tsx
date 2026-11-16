import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as reanimated from "../jest/mocks/react-native-reanimated";
import { CENTER_POP } from "./animationTimeline";
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
    animation: "ripple",
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

const flatStyle = (style: unknown) => Object.assign({}, ...[style].flat(2));

// The badge: the animated view that holds the center content.
function badgeStyle(): Style {
  return flatStyle(screen.getByText("Icon").parent?.props.style);
}

// The skeleton disc shown in place of the badge while loading.
function placeholderStyle(): Style & { backgroundColor?: string } {
  const [placeholder] = hostsNamed("Animated.View");
  return flatStyle(placeholder.props.style);
}

const { withTiming } = reanimated;

const popStarts = () => withTiming.mock.calls.filter(([toValue]) => toValue === CENTER_POP).length;

afterEach(() => {
  reanimated.setReducedMotion(false);
  withTiming.mockClear();
});

describe("AnimatedQrCode", () => {
  it("sends the QR matrix to the native view as flat row and column pairs", () => {
    renderQrCode();
    const matrix = createQrMatrix(ADDRESS, true);

    expect(nativeView().props).toMatchObject({
      animation: "ripple",
      animated: true,
      pressCount: 0,
      moduleCount: matrix.moduleCount,
      dots: matrix.dots.flatMap(({ row, col }) => [row, col]),
      style: { width: 200, height: 200 },
    });
  });

  it("draws the whole code, without a hole or a center, when there is no center content", () => {
    renderQrCode({ centerContent: undefined, animation: "loading" });
    const fullMatrix = createQrMatrix(ADDRESS, false);

    expect(nativeView().props).toMatchObject({
      moduleCount: fullMatrix.moduleCount,
      dots: fullMatrix.dots.flatMap(({ row, col }) => [row, col]),
    });
    expect(hostsNamed("Animated.View")).toHaveLength(0);
  });

  it("shows the loading skeleton while the value is empty", () => {
    renderQrCode({ value: "", animation: "loading" });

    expect(nativeView().props.dots.length).toBeGreaterThan(0);
    expect(placeholderStyle().opacity).toBe(1);
  });

  it("draws on white, whatever the screen behind", () => {
    renderQrCode();

    expect(flatStyle(screen.getByTestId(TEST_ID).props.style)).toMatchObject({
      backgroundColor: "#FFFFFF",
      width: 200,
      height: 200,
    });
  });

  it("shows the center content", () => {
    renderQrCode();

    expect(screen.getByText("Icon")).toBeOnTheScreen();
    expect(badgeStyle()).toMatchObject({ opacity: 1, transform: [{ scale: 1 }] });
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

  it("plays the ripple and pops the badge on a confirmed press", () => {
    renderQrCode({ onPress: jest.fn() });

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(nativeView().props.pressCount).toBe(1);
    expect(popStarts()).toBe(1);
  });

  it("plays nothing on a touch that does not end as a press, like the start of a scroll", () => {
    renderQrCode({ onPress: jest.fn() });

    fireEvent(screen.getByTestId(TEST_ID), "pressIn");

    expect(nativeView().props.pressCount).toBe(0);
    expect(popStarts()).toBe(0);
  });

  it("plays the ripple and pops the badge when the trigger key changes", () => {
    const { rerender } = renderQrCode({ triggerKey: 3 });

    act(() => rerender({ triggerKey: 4 }));

    expect(nativeView().props.pressCount).toBe(1);
    expect(popStarts()).toBe(1);
  });

  it("shows a skeleton disc instead of the badge while loading", () => {
    renderQrCode({ animation: "loading" });

    expect(nativeView().props.animation).toBe("loading");
    expect(badgeStyle().opacity).toBe(0);
    expect(placeholderStyle()).toMatchObject({ opacity: 1, backgroundColor: "rgb(233,233,233)" });
  });

  it("plays no press while loading", () => {
    renderQrCode({ animation: "loading", onPress: jest.fn() });

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(nativeView().props.pressCount).toBe(0);
  });

  it("hides the skeleton disc once loaded", () => {
    renderQrCode();

    expect(placeholderStyle().opacity).toBe(0);
  });

  describe("with reduced motion", () => {
    beforeEach(() => reanimated.setReducedMotion(true));

    it("draws the code still", () => {
      renderQrCode();

      expect(nativeView().props.animated).toBe(false);
    });

    it("plays nothing on press or on trigger, but still calls onPress", () => {
      const onPress = jest.fn();
      const { rerender } = renderQrCode({ onPress });

      fireEvent.press(screen.getByTestId(TEST_ID));
      act(() => rerender({ triggerKey: 1 }));

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(nativeView().props.pressCount).toBe(0);
      expect(popStarts()).toBe(0);
    });

    it("keeps the loading skeleton without the shimmer", () => {
      renderQrCode({ animation: "loading" });

      expect(placeholderStyle().backgroundColor).toBe("rgb(233,233,233)");
      expect(withTiming).not.toHaveBeenCalled();
    });
  });
});

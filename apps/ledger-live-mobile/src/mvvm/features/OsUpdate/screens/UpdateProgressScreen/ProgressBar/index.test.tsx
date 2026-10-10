import React from "react";
import { StyleSheet } from "react-native";
import { act, render, screen } from "@tests/test-renderer";
import { ProgressBar, PROGRESS_ANIMATION_MS } from ".";

const finishAnimation = () => {
  act(() => {
    jest.advanceTimersByTime(PROGRESS_ANIMATION_MS + 50);
  });
};

describe("ProgressBar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [0, 0],
    [0.256, 26],
    [1, 100],
    [-0.5, 0],
    [3, 100],
  ])("maps a progress of %s to %s%%, clamped between 0 and 100", (progress, expected) => {
    render(<ProgressBar progress={progress} testID="bar" />);

    expect(screen.getByTestId("bar").props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: expected,
    });
  });

  it("is a grey pill, 247 by 8, as designed", () => {
    render(<ProgressBar progress={0.5} testID="bar" />);

    expect(StyleSheet.flatten(screen.getByTestId("bar").props.style)).toMatchObject({
      width: 247,
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      alignSelf: "center",
      backgroundColor: "#1f1f1f",
    });
  });

  it("is filled with a plain white pill", () => {
    render(<ProgressBar progress={0.5} testID="bar" />);

    expect(StyleSheet.flatten(screen.getByTestId("bar-fill").props.style)).toMatchObject({
      height: "100%",
      borderRadius: 4,
      backgroundColor: "#ffffff",
    });
  });

  it("calls onAnimationEnd once the bar has reached its progress", () => {
    const onAnimationEnd = jest.fn();
    render(<ProgressBar progress={1} initialProgress={0.5} onAnimationEnd={onAnimationEnd} />);

    expect(onAnimationEnd).not.toHaveBeenCalled();

    finishAnimation();

    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("does not call onAnimationEnd when it unmounts mid-animation", () => {
    const onAnimationEnd = jest.fn();
    const { unmount } = render(
      <ProgressBar progress={1} initialProgress={0.5} onAnimationEnd={onAnimationEnd} />,
    );

    unmount();
    finishAnimation();

    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("only reports the end of the last animation when the progress moves on first", () => {
    const onAnimationEnd = jest.fn();
    const { rerender } = render(
      <ProgressBar progress={0.5} initialProgress={0.2} onAnimationEnd={onAnimationEnd} />,
    );

    act(() => {
      jest.advanceTimersByTime(PROGRESS_ANIMATION_MS / 2);
    });
    rerender(<ProgressBar progress={0.9} onAnimationEnd={onAnimationEnd} />);
    finishAnimation();

    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });
});

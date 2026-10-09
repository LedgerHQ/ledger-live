import React from "react";
import { act, render } from "@testing-library/react-native";
import LottieView from "lottie-react-native";
import { Lottie } from "./Lottie.native";

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: jest.fn(({ testID, ref }: { testID?: string; ref?: React.Ref<unknown> }) => {
      React.useImperativeHandle(ref, () => ({
        play: () => mockPlay(),
        pause: () => mockPause(),
      }));
      return React.createElement(View, { testID: testID ?? "lottie" });
    }),
  };
});

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockedLottieView = jest.mocked(LottieView) as unknown as jest.Mock;

function lastProps() {
  return mockedLottieView.mock.calls.at(-1)?.[0];
}

describe("Lottie (native)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("forwards the source, style and test id", () => {
    const source = { uri: "file:///a.lottie" };
    const style = { width: 10 };

    render(<Lottie source={source} style={style} testID="logo" />);

    expect(lastProps()).toEqual(expect.objectContaining({ source, style, testID: "logo" }));
  });

  it("forwards a bundler asset id untouched", () => {
    render(<Lottie source={123} />);

    expect(lastProps().source).toBe(123);
  });

  it("does not loop, autoplays and runs at normal speed by default", () => {
    render(<Lottie source={{ uri: "file:///a.lottie" }} />);

    expect(lastProps()).toEqual(expect.objectContaining({ loop: false, autoPlay: true, speed: 1 }));
  });

  it("leaves playback alone while paused is undefined", () => {
    render(<Lottie source={123} />);

    expect(mockPlay).not.toHaveBeenCalled();
    expect(mockPause).not.toHaveBeenCalled();
  });

  it("pauses and resumes following the paused prop", () => {
    const { rerender } = render(<Lottie source={123} paused />);
    expect(mockPause).toHaveBeenCalledTimes(1);

    rerender(<Lottie source={123} paused={false} />);

    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("resumes playback when the source changes while not paused", () => {
    const { rerender } = render(<Lottie source={{ id: "a" }} paused={false} />);
    mockPlay.mockClear();

    rerender(<Lottie source={{ id: "b" }} paused={false} />);

    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("reports completion unless the animation was cancelled", () => {
    const onComplete = jest.fn();
    render(<Lottie source={123} onComplete={onComplete} />);

    act(() => lastProps().onAnimationFinish(true));
    expect(onComplete).not.toHaveBeenCalled();

    act(() => lastProps().onAnimationFinish(false));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

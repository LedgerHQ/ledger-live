import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import Lottie from "lottie-react-native";
import { Animation } from "./Animation.native";

jest.mock("react-native-config", () => ({ __esModule: true, default: { DETOX: false } }));

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: jest.fn(({ testID }: { testID?: string }) =>
      React.createElement(View, { testID: testID ?? "lottie" }),
    ),
  };
});

const mockedLottie = jest.mocked(Lottie) as unknown as jest.Mock;

function lastProps() {
  return mockedLottie.mock.calls.at(-1)?.[0];
}

describe("Animation (native)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing without a source", () => {
    render(<Animation source={undefined as never} />);

    expect(screen.queryByTestId("lottie")).toBeNull();
    expect(mockedLottie).not.toHaveBeenCalled();
  });

  it("derives the aspect ratio from the animation dimensions", () => {
    render(<Animation source={{ w: 400, h: 200 } as never} />);

    expect(StyleSheet.flatten(lastProps().style)).toEqual(
      expect.objectContaining({ aspectRatio: 2 }),
    );
  });

  it("falls back to a square ratio when dimensions are unusable", () => {
    render(<Animation source={{ w: 400, h: 0 } as never} />);

    expect(StyleSheet.flatten(lastProps().style)).toEqual(
      expect.objectContaining({ aspectRatio: 1 }),
    );
  });

  it("lets an explicit style override the derived ratio", () => {
    render(<Animation source={{ w: 400, h: 200 } as never} style={{ aspectRatio: 3 }} />);

    expect(StyleSheet.flatten(lastProps().style)).toEqual(
      expect.objectContaining({ aspectRatio: 3 }),
    );
  });

  it("loops and plays by default", () => {
    render(<Animation source={{ w: 1, h: 1 } as never} />);

    expect(lastProps()).toEqual(expect.objectContaining({ loop: true, autoPlay: true }));
  });
});

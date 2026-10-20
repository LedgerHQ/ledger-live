import React from "react";
import { render } from "@tests/test-renderer";
import { useIsFocused } from "@react-navigation/native";
import { Media } from "../elements";

const mockVideoProps = jest.fn();

jest.mock("react-native-video", () => {
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  const Video = (props: { paused?: boolean }) => {
    mockVideoProps(props);
    return ReactActual.createElement(View, { testID: "content-card-video" });
  };

  return { __esModule: true, default: Video };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

const videoProps = {
  uri: "https://example.com/card.mp4",
  size: "L",
  mediaType: "video",
} as const;

function lastPausedProp() {
  return mockVideoProps.mock.lastCall?.[0].paused;
}

describe("Media", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should play the video while its screen is focused", () => {
    jest.mocked(useIsFocused).mockReturnValue(true);

    render(<Media {...videoProps} />);

    expect(lastPausedProp()).toBe(false);
  });

  it("should pause the video while its screen is not focused", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);

    render(<Media {...videoProps} />);

    expect(lastPausedProp()).toBe(true);
  });

  it("should resume the video when its screen is focused again", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);
    const { rerender } = render(<Media {...videoProps} />);

    jest.mocked(useIsFocused).mockReturnValue(true);
    rerender(<Media {...videoProps} />);

    expect(lastPausedProp()).toBe(false);
  });
});

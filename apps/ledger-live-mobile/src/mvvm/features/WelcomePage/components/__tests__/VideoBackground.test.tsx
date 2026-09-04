import React from "react";
import { render } from "@tests/test-renderer";
import type { OnLoadData } from "react-native-video";
import videoSources from "../../assets";
import { VideoBackground } from "../VideoBackground";

const mockSeek = jest.fn();
const mockUseIsAppInBackground = jest.fn(() => false);
const mockPlayer: { onLoad?: (data: OnLoadData) => void; onEnd?: () => void } = {};

jest.mock("react-native-video", () => {
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  const Video = ReactActual.forwardRef<
    { seek: (time: number) => void },
    { onLoad?: (data: OnLoadData) => void; onEnd?: () => void }
  >((props, ref) => {
    ReactActual.useImperativeHandle(ref, () => ({ seek: mockSeek }));
    mockPlayer.onLoad = props.onLoad;
    mockPlayer.onEnd = props.onEnd;
    return ReactActual.createElement(View, { testID: "welcome-video" });
  });

  return { __esModule: true, default: Video };
});

jest.mock("~/components/useIsAppInBackground", () => ({
  __esModule: true,
  default: () => mockUseIsAppInBackground(),
}));

const baseProps = {
  videoSource: videoSources.welcomeBasic1,
  titleKey: "onboarding.stepWelcome.videoTitles.0",
};

function loadVideo() {
  mockPlayer.onLoad?.({ duration: 4.567 } as OnLoadData);
}

function endVideo() {
  mockPlayer.onEnd?.();
}

describe("VideoBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsAppInBackground.mockReturnValue(false);
  });

  it("should not rewind a story whose player has not loaded yet", () => {
    const { rerender } = render(<VideoBackground {...baseProps} isOnStage />);

    rerender(<VideoBackground {...baseProps} isOnStage={false} />);
    rerender(<VideoBackground {...baseProps} isOnStage />);

    expect(mockSeek).not.toHaveBeenCalled();
  });

  it("should play the story from its first frame when it enters the stage", () => {
    const { rerender } = render(<VideoBackground {...baseProps} isOnStage />);
    loadVideo();

    rerender(<VideoBackground {...baseProps} isOnStage={false} />);
    expect(mockSeek).not.toHaveBeenCalled();

    rerender(<VideoBackground {...baseProps} isOnStage />);
    expect(mockSeek).toHaveBeenCalledWith(0);
  });

  it("should replay the story when it is restarted while on stage", () => {
    const { rerender } = render(<VideoBackground {...baseProps} isOnStage restartKey={0} />);
    loadVideo();

    rerender(<VideoBackground {...baseProps} isOnStage restartKey={1} />);

    expect(mockSeek).toHaveBeenCalledTimes(1);
    expect(mockSeek).toHaveBeenCalledWith(0);
  });

  it("should rewind the player when its story ends so the next lap plays it again", () => {
    const onVideoEnd = jest.fn();
    render(<VideoBackground {...baseProps} isOnStage onVideoEnd={onVideoEnd} />);
    loadVideo();

    endVideo();

    expect(mockSeek).toHaveBeenCalledWith(0);
    expect(onVideoEnd).toHaveBeenCalledTimes(1);
  });

  it("should not rewind after the player remounts until it has loaded again", () => {
    const { rerender } = render(<VideoBackground {...baseProps} isOnStage restartKey={0} />);
    loadVideo();
    mockSeek.mockClear();

    mockUseIsAppInBackground.mockReturnValue(true);
    rerender(<VideoBackground {...baseProps} isOnStage restartKey={0} />);

    mockUseIsAppInBackground.mockReturnValue(false);
    rerender(<VideoBackground {...baseProps} isOnStage restartKey={1} />);

    expect(mockSeek).not.toHaveBeenCalled();
  });

  it("should ignore the end of a story that is not on stage", () => {
    const onVideoEnd = jest.fn();
    render(<VideoBackground {...baseProps} isOnStage={false} onVideoEnd={onVideoEnd} />);
    loadVideo();

    endVideo();

    expect(mockSeek).not.toHaveBeenCalled();
    expect(onVideoEnd).not.toHaveBeenCalled();
  });

  it("should forward the loaded duration to the caller", () => {
    const onVideoLoad = jest.fn();
    render(<VideoBackground {...baseProps} isOnStage onVideoLoad={onVideoLoad} />);

    loadVideo();

    expect(onVideoLoad).toHaveBeenCalledWith(expect.objectContaining({ duration: 4.567 }));
  });
});

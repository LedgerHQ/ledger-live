import React, { useState } from "react";
import { render, screen } from "@tests/test-renderer";
import { DebugLottieLocalFileTab } from "../DebugLottieLocalFileTab";
import type { PickedLottieFile } from "../pickLocalLottieFile";

describe("DebugLottieLocalFileTab", () => {
  function LocalFileTabHarness({
    onBrowsePress,
    isPicking = false,
    pickError = null,
  }: {
    onBrowsePress: () => void;
    isPicking?: boolean;
    pickError?: string | null;
  }) {
    const [selection, setSelection] = useState<PickedLottieFile | null>(null);
    const [replayKey, setReplayKey] = useState(0);

    return (
      <DebugLottieLocalFileTab
        selection={selection}
        replayKey={replayKey}
        onReplay={() => setReplayKey(previous => previous + 1)}
        onBrowsePress={onBrowsePress}
        isPicking={isPicking}
        pickError={pickError}
      />
    );
  }

  it("renders browse control with no preview initially", async () => {
    render(<LocalFileTabHarness onBrowsePress={jest.fn()} />);

    expect(await screen.findByText("Browse .lottie file")).toBeTruthy();
    expect(screen.getByText("No animation selected yet")).toBeTruthy();
    expect(screen.queryByTestId("debug-lottie-local-light")).toBeNull();
  });

  it("renders preview when selection is provided from parent", async () => {
    function HarnessWithSelection() {
      const [replayKey, setReplayKey] = useState(0);

      return (
        <DebugLottieLocalFileTab
          selection={{
            name: "animation.lottie",
            uri: "file:///picked/animation.lottie",
          }}
          replayKey={replayKey}
          onReplay={() => setReplayKey(previous => previous + 1)}
          onBrowsePress={jest.fn()}
          isPicking={false}
          pickError={null}
        />
      );
    }

    render(<HarnessWithSelection />);

    expect(await screen.findByText("Showing 'animation.lottie'")).toBeTruthy();
    expect(screen.getByTestId("debug-lottie-local-light")).toBeTruthy();
    expect(screen.getByTestId("debug-lottie-local-dark")).toBeTruthy();
  });

  it("shows pick errors from parent", async () => {
    render(
      <LocalFileTabHarness
        onBrowsePress={jest.fn()}
        pickError="Failed to copy picked file locally"
      />,
    );

    expect(screen.getByText("Failed to copy picked file locally")).toBeTruthy();
  });
});

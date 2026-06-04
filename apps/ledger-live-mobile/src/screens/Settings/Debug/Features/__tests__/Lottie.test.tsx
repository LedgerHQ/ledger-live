import React from "react";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import DebugLottie from "../Lottie";
import {
  consumeStashedDebugLottiePick,
  InvalidLottieExtensionError,
  pickLocalLottieFile,
  stashDebugLottiePick,
} from "../pickLocalLottieFile";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: jest.fn((callback: () => void) => callback()),
}));

jest.mock("../pickLocalLottieFile", () => ({
  ...jest.requireActual("../pickLocalLottieFile"),
  pickLocalLottieFile: jest.fn(),
}));

jest.mock("../DebugLottieDeviceTab", () => ({
  DebugLottieDeviceTab: () => {
    const ReactNative = require("react-native");
    return <ReactNative.Text>Device tab content</ReactNative.Text>;
  },
}));

jest.mock("LLM/components/Lottie", () => ({
  Lottie: ({ testID }: { testID?: string }) => {
    const ReactNative = require("react-native");
    return <ReactNative.View testID={testID} />;
  },
}));

const mockedPickLocalLottieFile = jest.mocked(pickLocalLottieFile);

describe("DebugLottie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumeStashedDebugLottiePick();
    mockedPickLocalLottieFile.mockResolvedValue(null);
  });

  it("renders the device tab by default", () => {
    render(<DebugLottie />);

    expect(screen.getByText("Device tab content")).toBeVisible();
    expect(screen.getByText("Device")).toBeVisible();
    expect(screen.getByText("Local file")).toBeVisible();
  });

  it("switches to the local file tab", async () => {
    render(<DebugLottie />);

    fireEvent.press(screen.getByText("Local file"));

    expect(await screen.findByText("Browse .lottie file")).toBeVisible();
    expect(screen.getByText("No animation selected yet")).toBeVisible();
  });

  it("restores a stashed local pick when the screen gains focus", async () => {
    stashDebugLottiePick({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });

    render(<DebugLottie />);
    fireEvent.press(screen.getByText("Local file"));

    expect(await screen.findByText("Showing 'animation.lottie'")).toBeVisible();
    expect(screen.getByTestId("debug-lottie-local-light")).toBeVisible();
  });

  it("commits a picked local file from the browse action", async () => {
    mockedPickLocalLottieFile.mockResolvedValue({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });

    render(<DebugLottie />);
    fireEvent.press(screen.getByText("Local file"));
    fireEvent.press(await screen.findByText("Browse .lottie file"));

    await waitFor(() =>
      expect(screen.getByText("Showing 'animation.lottie'")).toBeVisible(),
    );
  });

  it("shows pick errors from the browse action", async () => {
    mockedPickLocalLottieFile.mockRejectedValue(
      new InvalidLottieExtensionError("animation.json"),
    );

    render(<DebugLottie />);
    fireEvent.press(screen.getByText("Local file"));
    fireEvent.press(await screen.findByText("Browse .lottie file"));

    expect(await screen.findByText('"animation.json" is not a .lottie file')).toBeVisible();
  });

  it("switches back to the device tab", async () => {
    render(<DebugLottie />);

    fireEvent.press(screen.getByText("Local file"));
    expect(await screen.findByText("Browse .lottie file")).toBeVisible();

    fireEvent.press(screen.getByText("Device"));

    expect(screen.getByText("Device tab content")).toBeVisible();
  });

  it("replays the selected local animation", async () => {
    mockedPickLocalLottieFile.mockResolvedValue({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });

    render(<DebugLottie />);
    fireEvent.press(screen.getByText("Local file"));
    fireEvent.press(await screen.findByText("Browse .lottie file"));
    await waitFor(() =>
      expect(screen.getByText("Showing 'animation.lottie'")).toBeVisible(),
    );

    fireEvent.press(screen.getByText("Replay"));
    expect(screen.getByTestId("debug-lottie-local-light")).toBeVisible();
  });
});

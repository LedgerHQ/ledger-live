import React from "react";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import CopyLink from "../components/CopyLink";

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

jest.mock("@ledgerhq/native-ui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
    IconsLegacy: {
      CheckAloneMedium: () => React.createElement(Text, null, "copied-icon"),
    },
  };
});

jest.mock("~/components/Touchable", () => {
  const React = require("react");
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement(TouchableOpacity, { onPress, testID: "copy-link" }, children),
  };
});

jest.mock("~/colors", () => ({
  withTheme: (Component: React.ComponentType) => Component,
}));

const setString = Clipboard.setString as jest.Mock;

describe("components/CopyLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders its children before anything is copied", () => {
    render(
      <CopyLink string="B62qtest" replacement="Copied">
        Copy address
      </CopyLink>,
    );

    expect(screen.getByText("Copy address")).toBeOnTheScreen();
    expect(screen.queryByText("copied-icon")).not.toBeOnTheScreen();
  });

  it("copies the string and swaps to the replacement label on press", async () => {
    const onCopy = jest.fn();
    const user = userEvent.setup();
    render(
      <CopyLink string="B62qtest" replacement="Copied" onCopy={onCopy}>
        Copy address
      </CopyLink>,
    );

    await user.press(screen.getByTestId("copy-link"));

    expect(setString).toHaveBeenCalledWith("B62qtest");
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copied")).toBeOnTheScreen();
    expect(screen.getByText("copied-icon")).toBeOnTheScreen();
  });

  it("keeps the children when no replacement is provided", async () => {
    const user = userEvent.setup();
    render(<CopyLink string="B62qtest">Copy address</CopyLink>);

    await user.press(screen.getByTestId("copy-link"));

    expect(screen.getByText("Copy address")).toBeOnTheScreen();
    expect(screen.queryByText("copied-icon")).not.toBeOnTheScreen();
  });

  it("ignores a second press while the copied state is still on", async () => {
    const user = userEvent.setup();
    render(
      <CopyLink string="B62qtest" replacement="Copied">
        Copy address
      </CopyLink>,
    );

    await user.press(screen.getByTestId("copy-link"));
    await user.press(screen.getByTestId("copy-link"));

    expect(setString).toHaveBeenCalledTimes(1);
  });

  it("reverts to the children once the copied state expires", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CopyLink string="B62qtest" replacement="Copied">
        Copy address
      </CopyLink>,
    );

    await user.press(screen.getByTestId("copy-link"));
    expect(screen.getByText("Copied")).toBeOnTheScreen();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Copy address")).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it("clears the pending timeout when unmounted", async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { unmount } = render(
      <CopyLink string="B62qtest" replacement="Copied">
        Copy address
      </CopyLink>,
    );

    await user.press(screen.getByTestId("copy-link"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});

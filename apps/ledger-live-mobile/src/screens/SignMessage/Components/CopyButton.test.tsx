import React from "react";
import { render, fireEvent } from "@tests/test-renderer";
import { screen } from "@testing-library/react-native";
import CopyButton from "./CopyButton";
import Clipboard from "@react-native-clipboard/clipboard";

jest.mock("@react-native-clipboard/clipboard", () => ({
  setString: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe("CopyButton", () => {
  const testText = "Text to copy";

  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("renders correctly with copy icon and text", () => {
    render(<CopyButton text={testText} />);

    expect(screen.getByTestId("copy-wrapper")).toBeVisible();
    expect(screen.getByText("Copy")).toBeVisible();
  });

  it("copies text to clipboard when clicked", async () => {
    const mockClipboard = jest.spyOn(Clipboard, "setString");
    const { user } = render(<CopyButton text={testText} />);
    const button = screen.getByText("Copy");

    await user.press(button);
    expect(button).toBeVisible();

    expect(mockClipboard).toHaveBeenCalledWith(testText);
  });

  it("shows success state after copying", async () => {
    const { user } = render(<CopyButton text={testText} />);
    const button = screen.getByText("Copy");

    await user.press(button);

    expect(screen.getByTestId("copy-wrapper")).toBeVisible();
    expect(screen.getByText("Copied")).toBeVisible();
  });
});

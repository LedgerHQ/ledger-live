import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { copyToClipboard } from "@shared/clipboard";
import CopyButton from "./CopyButton";

jest.mock("@shared/clipboard");

describe("CopyButton", () => {
  const testText = "Text to copy";
  beforeEach(() => {
    jest.mocked(copyToClipboard).mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("renders correctly with copy icon and text", () => {
    render(<CopyButton text={testText} />);

    expect(screen.getByTestId("copy-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("copy-wrapper").children.length).toEqual(2);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies text to clipboard when clicked", async () => {
    const { user } = render(<CopyButton text={testText} />);
    const button = screen.getByRole("button", { name: "Copy" });

    await user.click(button);
    expect(button).toBeVisible();

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(testText);
    });
  });

  it("shows success state after copying", async () => {
    const { user } = render(<CopyButton text={testText} />);
    const button = screen.getByRole("button", { name: "Copy" });

    await user.click(button);

    expect(screen.getByTestId("copy-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("copy-wrapper").children.length).toEqual(2);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});

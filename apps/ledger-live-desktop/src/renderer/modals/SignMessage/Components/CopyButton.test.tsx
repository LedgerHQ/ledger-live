import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import CopyButton from "./CopyButton";

jest.mock("i18next", () => {
  return {
    __esModule: true,
    t: jest.fn(key => {
      if (key === "common.copy") return "Copy";
      if (key === "common.copied") return "Copied";
      return key;
    }),
    default: {
      use: jest.fn().mockReturnThis(),
      init: jest.fn(),
    },
  };
});

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

    expect(screen.getByTestId("copy-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("copy-wrapper").children.length).toEqual(2);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies text to clipboard when clicked", async () => {
    jest.spyOn(navigator.clipboard, "writeText").mockImplementation(() => Promise.resolve());

    const { user } = render(<CopyButton text={testText} />);
    const button = screen.getByRole("button", { name: "Copy" });

    await user.click(button);
    expect(button).toBeVisible();

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
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

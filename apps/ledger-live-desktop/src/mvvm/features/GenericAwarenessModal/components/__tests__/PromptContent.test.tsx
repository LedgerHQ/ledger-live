import React from "react";
import { render, screen } from "tests/testSetup";
import useTheme from "~/renderer/hooks/useTheme";
import { PROMPT_TEXT_LINE_LIMITS } from "../clampedText";
import PromptContent from "../PromptContent";

const baseProps = {
  title: "Test title",
  subtitle: "Test subtitle",
  primaryButtonLabel: "Primary",
  primaryButtonLink: "https://example.com/primary",
  secondaryButtonLabel: "Secondary",
  secondaryButtonLink: "https://example.com/secondary",
  onPrimaryClick: jest.fn(),
  onSecondaryClick: jest.fn(),
};

jest.mock("~/renderer/hooks/useTheme");

const mockUseTheme = jest.mocked(useTheme);

describe("PromptContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ theme: "light" } as ReturnType<typeof useTheme>);
  });

  it("should render title and subtitle with prompt line limits", () => {
    render(<PromptContent {...baseProps} />);

    expect(screen.getByText("Test title")).toHaveClass("truncate");
    expect(screen.getByText("Test subtitle").style.getPropertyValue("-webkit-line-clamp")).toBe(
      String(PROMPT_TEXT_LINE_LIMITS.subtitle),
    );
    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Secondary" })).toBeVisible();
  });

  it.each([
    ["primary", { primaryButtonLabel: "", primaryButtonLink: "https://example.com/primary" }],
    ["primary", { primaryButtonLabel: "Primary", primaryButtonLink: "" }],
    [
      "secondary",
      { secondaryButtonLabel: "", secondaryButtonLink: "https://example.com/secondary" },
    ],
    ["secondary", { secondaryButtonLabel: "Secondary", secondaryButtonLink: "" }],
  ] as const)("should hide the %s button when label or link is empty", (button, patch) => {
    render(<PromptContent {...baseProps} {...patch} />);

    expect(
      screen.queryByTestId(`generic-awareness-modal-${button}-button`),
    ).not.toBeInTheDocument();
  });

  it("should call onPrimaryClick when the primary button is pressed", async () => {
    const { user } = render(<PromptContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

    expect(baseProps.onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it("should call onSecondaryClick when the secondary button is pressed", async () => {
    const { user } = render(<PromptContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-secondary-button"));

    expect(baseProps.onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["light", "https://example.com/hero-light.png"],
    ["dark", "https://example.com/hero-dark.png"],
  ] as const)("should render the %s image when themed urls are provided", (theme, expectedSrc) => {
    mockUseTheme.mockReturnValue({ theme } as ReturnType<typeof useTheme>);
    const { container } = render(
      <PromptContent
        {...baseProps}
        imageUrlLight="https://example.com/hero-light.png"
        imageUrlDark="https://example.com/hero-dark.png"
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", expectedSrc);
  });
});

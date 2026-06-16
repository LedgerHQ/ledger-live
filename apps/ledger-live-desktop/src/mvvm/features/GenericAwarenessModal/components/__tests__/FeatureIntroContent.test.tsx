import React from "react";
import { render, screen } from "tests/testSetup";
import useTheme from "~/renderer/hooks/useTheme";
import FeatureIntroContent from "../FeatureIntroContent";
import { FEATURE_INTRO_TEXT_LINE_LIMITS } from "../clampedText";

const baseProps = {
  title: "Test title",
  subtitle: "Test subtitle",
  items: [
    {
      title: "Item title",
      subtitle: "Item description",
      icon: "HandCoins" as const,
    },
  ],
  primaryButtonLabel: "Primary",
  primaryButtonLink: "https://example.com/primary",
  secondaryButtonLabel: "Secondary",
  secondaryButtonLink: "https://example.com/secondary",
  onPrimaryClick: jest.fn(),
  onSecondaryClick: jest.fn(),
};

jest.mock("~/renderer/hooks/useTheme");

const mockUseTheme = jest.mocked(useTheme);

describe("FeatureIntroContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ theme: "light" } as ReturnType<typeof useTheme>);
  });

  it("should render copy with line limits", () => {
    render(<FeatureIntroContent {...baseProps} />);

    expect(screen.getByText("Test title")).toBeVisible();
    expect(screen.getByText("Item description")).toBeVisible();
    expect(screen.getByText("Test title").style.getPropertyValue("-webkit-line-clamp")).toBe(
      String(FEATURE_INTRO_TEXT_LINE_LIMITS.title),
    );
    expect(screen.getByText("Item title")).toHaveClass("truncate");
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
    render(<FeatureIntroContent {...baseProps} {...patch} />);

    expect(
      screen.queryByTestId(`generic-awareness-modal-${button}-button`),
    ).not.toBeInTheDocument();
  });

  it("should call action handlers when buttons are pressed", async () => {
    const { user } = render(<FeatureIntroContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));
    await user.click(screen.getByTestId("generic-awareness-modal-secondary-button"));

    expect(baseProps.onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(baseProps.onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["light", "https://example.com/hero-light.png"],
    ["dark", "https://example.com/hero-dark.png"],
  ] as const)("should render the %s image when themed urls are provided", (theme, expectedSrc) => {
    mockUseTheme.mockReturnValue({ theme } as ReturnType<typeof useTheme>);
    const { container } = render(
      <FeatureIntroContent
        {...baseProps}
        imageUrlLight="https://example.com/hero-light.png"
        imageUrlDark="https://example.com/hero-dark.png"
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", expectedSrc);
    expect(img).toHaveClass("border", "border-solid", "border-icon");
  });

  it("should render the hero placeholder with the icon border when no image is provided", () => {
    const { container } = render(<FeatureIntroContent {...baseProps} />);

    const placeholder = container.querySelector("[aria-hidden]");
    expect(placeholder).toHaveClass("border", "border-solid", "border-icon");
  });
});

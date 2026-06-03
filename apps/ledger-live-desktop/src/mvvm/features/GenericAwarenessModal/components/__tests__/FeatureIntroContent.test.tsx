import React from "react";
import { render, screen } from "tests/testSetup";
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
  secondaryButtonLabel: "Secondary",
  onPrimaryClick: jest.fn(),
  onSecondaryClick: jest.fn(),
};

describe("FeatureIntroContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("should call action handlers when buttons are pressed", async () => {
    const { user } = render(<FeatureIntroContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));
    await user.click(screen.getByTestId("generic-awareness-modal-secondary-button"));

    expect(baseProps.onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(baseProps.onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it("should render an image when imageUrl is provided", () => {
    const { container } = render(
      <FeatureIntroContent {...baseProps} imageUrl="https://example.com/hero.png" />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://example.com/hero.png");
  });
});

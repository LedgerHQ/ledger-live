import React from "react";
import { render, screen } from "tests/testSetup";
import FeatureIntroContent from "../FeatureIntroContent";

const baseProps = {
  title: "Test title",
  subtitle: "Test subtitle",
  items: [
    {
      id: "item-1",
      title: "Item title",
      description: "Item description",
      iconName: "HandCoins" as const,
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

  it("should render title, subtitle, and list item copy", () => {
    render(<FeatureIntroContent {...baseProps} />);

    expect(screen.getByText("Test title")).toBeVisible();
    expect(screen.getByText("Test subtitle")).toBeVisible();
    expect(screen.getByText("Item title")).toBeVisible();
    expect(screen.getByText("Item description")).toBeVisible();
  });

  it("should call onPrimaryClick when the primary button is pressed", async () => {
    const { user } = render(<FeatureIntroContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

    expect(baseProps.onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it("should call onSecondaryClick when the secondary button is pressed", async () => {
    const { user } = render(<FeatureIntroContent {...baseProps} />);

    await user.click(screen.getByTestId("generic-awareness-modal-secondary-button"));

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

import React from "react";
import { render, screen } from "tests/testSetup";
import PromptContent from "../PromptContent";

const baseProps = {
  title: "Test title",
  subtitle: "Test subtitle",
  primaryButtonLabel: "Primary",
  secondaryButtonLabel: "Secondary",
  onPrimaryClick: jest.fn(),
  onSecondaryClick: jest.fn(),
};

describe("PromptContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render title, subtitle, and button labels", () => {
    render(<PromptContent {...baseProps} />);

    expect(screen.getByText("Test title")).toBeVisible();
    expect(screen.getByText("Test subtitle")).toBeVisible();
    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Secondary" })).toBeVisible();
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

  it("should render an image when imageUrl is provided", () => {
    const { container } = render(
      <PromptContent {...baseProps} imageUrl="https://example.com/hero.png" />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://example.com/hero.png");
  });
});

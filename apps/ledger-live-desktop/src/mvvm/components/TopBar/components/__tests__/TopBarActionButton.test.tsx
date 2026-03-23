import React from "react";
import { render, screen } from "tests/testSetup";
import { TopBarActionButton } from "../TopBarActionButton";
import { Eye, Clock } from "@ledgerhq/lumen-ui-react/symbols";

describe("TopBarActionButton", () => {
  const defaultProps = {
    label: "test-action",
    isInteractive: true,
    onClick: jest.fn(),
    icon: Eye,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an IconButton when no cta is provided", () => {
    render(<TopBarActionButton {...defaultProps} />);

    const button = screen.getByTestId("topbar-action-button-test-action");
    expect(button).toBeVisible();
    expect(button).toHaveAttribute("aria-label", "test-action");
    expect(screen.queryByText("History")).not.toBeInTheDocument();
  });

  it("renders a Button with text label when cta is provided", () => {
    render(<TopBarActionButton {...defaultProps} icon={Clock} cta="History" />);

    const button = screen.getByTestId("topbar-action-button-test-action");
    expect(button).toBeVisible();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("calls onClick when the cta button is clicked", async () => {
    const handleClick = jest.fn();

    const { user } = render(
      <TopBarActionButton {...defaultProps} icon={Clock} cta="History" onClick={handleClick} />,
    );

    await user.click(screen.getByTestId("topbar-action-button-test-action"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables the cta button when isInteractive is false", () => {
    render(
      <TopBarActionButton {...defaultProps} icon={Clock} cta="History" isInteractive={false} />,
    );

    const button = screen.getByTestId("topbar-action-button-test-action");
    expect(button).toBeDisabled();
  });

  it("calls onClick when the icon button is clicked", async () => {
    const handleClick = jest.fn();

    const { user } = render(<TopBarActionButton {...defaultProps} onClick={handleClick} />);

    await user.click(screen.getByTestId("topbar-action-button-test-action"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables the icon button when isInteractive is false", () => {
    render(<TopBarActionButton {...defaultProps} isInteractive={false} />);

    const button = screen.getByTestId("topbar-action-button-test-action");
    expect(button).toBeDisabled();
  });
});

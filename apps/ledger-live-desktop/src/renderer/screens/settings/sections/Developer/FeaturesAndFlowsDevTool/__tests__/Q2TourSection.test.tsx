import React from "react";
import { render, screen } from "tests/testSetup";
import { Q2TourSection } from "../Q2TourSection";

const defaultProps = {
  hasSeen: false,
  isEnabled: true,
  onToggleHasSeen: jest.fn(),
  onToggleEnabled: jest.fn(),
  onOpenDrawer: jest.fn(),
};

describe("Q2TourSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should toggle release tour and open the drawer when eligible", async () => {
    const { user } = render(<Q2TourSection {...defaultProps} />);
    const [releaseTourSwitch] = screen.getAllByRole("switch");
    const openDrawerButton = screen.getByRole("button");

    expect(releaseTourSwitch).toBeChecked();
    expect(openDrawerButton).toBeEnabled();

    await user.click(releaseTourSwitch);
    await user.click(openDrawerButton);

    expect(defaultProps.onToggleEnabled).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it.each([
    { hasSeen: true, isEnabled: true },
    { hasSeen: false, isEnabled: false },
  ])("should disable the drawer when hasSeen is $hasSeen and isEnabled is $isEnabled", props => {
    render(<Q2TourSection {...defaultProps} {...props} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

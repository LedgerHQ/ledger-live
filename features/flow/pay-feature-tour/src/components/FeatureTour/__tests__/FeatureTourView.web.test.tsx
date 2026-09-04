import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FeatureTourView } from "../FeatureTourView.web";

const defaultProps: React.ComponentProps<typeof FeatureTourView> = {
  isVisible: true,
  title: "Pay and get paid",
  description: "Stablecoin closes the gap between crypto and real life spending",
  ctaLabel: "Got it",
  rows: [
    { icon: "Globe", title: "Spend everywhere", description: "Use your balance around the world" },
  ],
  onShown: jest.fn(),
  onDismiss: jest.fn(),
};

describe("FeatureTourView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("signals it was shown once across re-renders", () => {
    const onShown = jest.fn();
    const { rerender } = render(<FeatureTourView {...defaultProps} onShown={onShown} />);

    rerender(<FeatureTourView {...defaultProps} onShown={onShown} />);

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("does not signal it was shown while hidden", () => {
    const onShown = jest.fn();
    render(<FeatureTourView {...defaultProps} isVisible={false} onShown={onShown} />);

    expect(onShown).not.toHaveBeenCalled();
  });

  it("dismisses once even if the CTA is clicked repeatedly", () => {
    const onDismiss = jest.fn();
    render(<FeatureTourView {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText("Got it"));
    fireEvent.click(screen.getByText("Got it"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

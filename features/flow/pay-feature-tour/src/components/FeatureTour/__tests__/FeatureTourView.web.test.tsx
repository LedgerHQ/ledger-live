import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { trackedPages } from "@features/platform-pay-analytics/testing/module-mock";
import { FeatureTourView } from "../FeatureTourView.web";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

const defaultProps: React.ComponentProps<typeof FeatureTourView> = {
  isVisible: true,
  title: "Pay and get paid",
  description: "Stablecoin closes the gap between crypto and real life spending",
  ctaLabel: "Explore Pay",
  rows: [
    {
      icon: "Contact",
      title: "Spend everywhere",
      description: "Use your balance around the world",
    },
  ],
  onClose: jest.fn(),
  onContinue: jest.fn(),
};

function renderView(props: Partial<React.ComponentProps<typeof FeatureTourView>> = {}) {
  return render(<FeatureTourView {...defaultProps} {...props} />);
}

describe("FeatureTourView (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("tracks the page while visible", () => {
    renderView();

    expect(trackedPages()).toContainEqual({ page: "Feature Intro", name: "pay", flow: "pay" });
  });

  it("does not track the page while hidden", () => {
    renderView({ isVisible: false });

    expect(trackedPages()).toHaveLength(0);
  });

  it("dismisses once even if the CTA is clicked repeatedly", () => {
    const onContinue = jest.fn();
    renderView({ onContinue });

    fireEvent.click(screen.getByText("Explore Pay"));
    fireEvent.click(screen.getByText("Explore Pay"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

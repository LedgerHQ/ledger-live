import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { FeatureTourView } from "../FeatureTourView.web";

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
  return render(
    <PayAnalyticsProvider
      adapter={{ track: jest.fn() }}
      renderPage={(page, properties) => (
        <span data-testid="pay-track-page">{`${page}:${properties?.flow}`}</span>
      )}
    >
      <FeatureTourView {...defaultProps} {...props} />
    </PayAnalyticsProvider>,
  );
}

describe("FeatureTourView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("tracks the page while visible", () => {
    renderView();

    expect(screen.getByTestId("pay-track-page")).toHaveTextContent("Feature Intro:pay");
  });

  it("does not track the page while hidden", () => {
    renderView({ isVisible: false });

    expect(screen.queryByTestId("pay-track-page")).toBeNull();
  });

  it("dismisses once even if the CTA is clicked repeatedly", () => {
    const onContinue = jest.fn();
    renderView({ onContinue });

    fireEvent.click(screen.getByText("Explore Pay"));
    fireEvent.click(screen.getByText("Explore Pay"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

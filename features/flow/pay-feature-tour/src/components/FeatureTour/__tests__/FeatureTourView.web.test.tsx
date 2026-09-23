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
  onDismiss: jest.fn(),
};

function renderView(props: Partial<React.ComponentProps<typeof FeatureTourView>> = {}) {
  return render(
    <PayAnalyticsProvider
      adapter={{ track: jest.fn() }}
      renderPage={page => <span data-testid="pay-track-page">{page}</span>}
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

    expect(screen.getByTestId("pay-track-page")).toHaveTextContent("card feature intro");
  });

  it("does not track the page while hidden", () => {
    renderView({ isVisible: false });

    expect(screen.queryByTestId("pay-track-page")).toBeNull();
  });

  it("dismisses once even if the CTA is clicked repeatedly", () => {
    const onDismiss = jest.fn();
    renderView({ onDismiss });

    fireEvent.click(screen.getByText("Explore Pay"));
    fireEvent.click(screen.getByText("Explore Pay"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

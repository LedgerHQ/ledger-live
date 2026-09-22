import React from "react";
import { Text } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { FeatureTourView } from "../FeatureTourView.native";

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
      renderPage={page => <Text testID="pay-track-page">{page}</Text>}
    >
      <FeatureTourView {...defaultProps} {...props} />
    </PayAnalyticsProvider>,
  );
}

describe("FeatureTourView (Native)", () => {
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

  it("keeps the sheet mounted but hides its content while not visible", () => {
    renderView({ isVisible: false });

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet).toBeVisible();
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });

  it("requests the sheet to open and renders its content when visible", () => {
    renderView();

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByLabelText("Explore Pay")).toBeVisible();
  });

  it("dismisses once even if the CTA is pressed repeatedly", () => {
    const onDismiss = jest.fn();
    renderView({ onDismiss });

    const cta = screen.getByLabelText("Explore Pay");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("hides its content after being dismissed", () => {
    renderView();

    fireEvent.press(screen.getByLabelText("Explore Pay"));

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});

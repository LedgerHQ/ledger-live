import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { trackedPages } from "@features/platform-pay-analytics/testing/module-mock";
import { FeatureTourView } from "../FeatureTourView.native";

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

describe("FeatureTourView (Native)", () => {
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
    const onContinue = jest.fn();
    renderView({ onContinue });

    const cta = screen.getByLabelText("Explore Pay");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("hides its content after being dismissed", () => {
    renderView();

    fireEvent.press(screen.getByLabelText("Explore Pay"));

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});

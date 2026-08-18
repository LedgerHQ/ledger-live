import React from "react";
import { View } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { FeatureTourView } from "../FeatureTourView.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      {children}
    </View>
  ),
}));

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

describe("FeatureTourView (Native)", () => {
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

  it("keeps the sheet mounted but hides its content while not visible", () => {
    render(<FeatureTourView {...defaultProps} isVisible={false} />);

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet).toBeTruthy();
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });

  it("requests the sheet to open and renders its content when visible", () => {
    render(<FeatureTourView {...defaultProps} />);

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("Pay and get paid")).toBeTruthy();
    expect(screen.getByLabelText("Got it")).toBeTruthy();
  });

  it("dismisses once even if the CTA is pressed repeatedly", () => {
    const onDismiss = jest.fn();
    render(<FeatureTourView {...defaultProps} onDismiss={onDismiss} />);

    const cta = screen.getByLabelText("Got it");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("hides its content after being dismissed", () => {
    render(<FeatureTourView {...defaultProps} />);

    fireEvent.press(screen.getByLabelText("Got it"));

    const sheet = screen.getByTestId("pay-feature-tour-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Pay and get paid")).toBeNull();
  });
});

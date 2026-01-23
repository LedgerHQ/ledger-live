import React from "react";
import { render, screen, act } from "tests/testSetup";
import { DesyncOverlay } from "../components/DesyncOverlay";

describe("DesyncOverlay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show desync overlay", () => {
    render(<DesyncOverlay isOpen productName="stax" />);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("onboarding-desync-overlay")).toBeInTheDocument();
  });

  it("should wait for delay before displaying desync overly", () => {
    render(<DesyncOverlay isOpen productName="stax" delay={1000} />);

    expect(screen.queryByTestId("onboarding-desync-overlay")).not.toBeInTheDocument();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("onboarding-desync-overlay")).toBeInTheDocument();
  });
});

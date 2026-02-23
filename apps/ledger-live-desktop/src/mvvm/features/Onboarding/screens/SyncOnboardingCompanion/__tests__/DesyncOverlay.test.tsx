import React from "react";
import { render, screen, act } from "tests/testSetup";
import { DesyncOverlay } from "../components/DesyncOverlay";

describe("DesyncOverlay", () => {
  beforeEach(() => {
    // React 19's act() uses queueMicrotask for scheduling — faking it causes act() to hang
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show desync overlay", async () => {
    render(<DesyncOverlay isOpen productName="stax" />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("onboarding-desync-overlay")).toBeVisible();
  });

  it("should wait for delay before displaying desync overlay", async () => {
    render(<DesyncOverlay isOpen productName="stax" delay={1000} />);

    expect(screen.queryByTestId("onboarding-desync-overlay")).toBeNull();

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("onboarding-desync-overlay")).toBeVisible();
  });
});

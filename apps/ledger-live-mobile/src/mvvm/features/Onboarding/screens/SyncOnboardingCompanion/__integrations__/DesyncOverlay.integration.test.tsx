import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import DesyncOverlay, { PlainOverlay } from "../components/DesyncOverlay";

const productName = "Ledger Stax";
const resyncMessage = "Connection with Ledger Stax lost. Trying to reconnect.";

describe("DesyncOverlay", () => {
  it("should display the resync message when open", async () => {
    render(<DesyncOverlay isOpen productName={productName} />);

    expect(await screen.findByText(resyncMessage)).toBeVisible();
  });

  it("should not render anything when closed", () => {
    render(<DesyncOverlay isOpen={false} productName={productName} />);

    expect(screen.queryByText(resyncMessage)).not.toBeOnTheScreen();
  });

  it("should only display the message after the given delay", () => {
    jest.useFakeTimers();
    try {
      render(<DesyncOverlay isOpen delay={5000} productName={productName} />);

      expect(screen.queryByText(resyncMessage)).not.toBeOnTheScreen();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText(resyncMessage)).toBeVisible();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("PlainOverlay", () => {
  it("should render the overlay when open", () => {
    jest.useFakeTimers();
    try {
      const { toJSON } = render(<PlainOverlay isOpen />);

      // Hidden until the (zero) delay timer flushes...
      expect(toJSON()).toBeNull();

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(toJSON()).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("should not render anything when closed", () => {
    const { toJSON } = render(<PlainOverlay isOpen={false} />);

    expect(toJSON()).toBeNull();
  });
});

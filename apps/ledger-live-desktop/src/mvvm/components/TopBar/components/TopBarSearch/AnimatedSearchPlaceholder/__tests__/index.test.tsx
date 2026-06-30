import React from "react";
import { render, screen, act } from "tests/testSetup";
import { AnimatedSearchPlaceholder } from "..";
import { PLACEHOLDER_INTERVAL_MS } from "../useCyclingPlaceholder";

describe("AnimatedSearchPlaceholder", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows the first phrase at rest", () => {
    render(<AnimatedSearchPlaceholder visible cycling testId="ph" />);

    expect(screen.getByText("Search crypto")).toBeInTheDocument();
    expect(screen.queryByText("Search stablecoins")).not.toBeInTheDocument();
  });

  it("keeps the outgoing phrase mounted while the next one slides in (no blink)", () => {
    render(<AnimatedSearchPlaceholder visible cycling testId="ph" />);

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS);
    });

    expect(screen.getByText("Search stablecoins")).toBeInTheDocument();
    expect(screen.getByText("Search crypto")).toBeInTheDocument();
  });

  it("does not cycle while the overlay is open (cycling=false)", () => {
    render(<AnimatedSearchPlaceholder visible cycling={false} testId="ph" />);

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS * 2);
    });

    expect(screen.getByText("Search crypto")).toBeInTheDocument();
    expect(screen.queryByText("Search stablecoins")).not.toBeInTheDocument();
  });
});

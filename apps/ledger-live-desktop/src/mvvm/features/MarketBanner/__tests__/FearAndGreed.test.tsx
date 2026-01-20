import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { FearAndGreedView } from "../components/FearAndGreed";
import { GradientMoodIndicator } from "../components/FearAndGreed/GradientMoodIndicator";

describe("FearAndGreed", () => {
  it("renders without crashing", () => {
    const props = {
      isLoading: false,
      data: { value: 50, classification: "Neutral" },
    };
    render(<FearAndGreedView {...props} />);
    expect(screen.getByTestId("fear-and-greed-card")).toBeVisible();
  });

  it("renders loading state", () => {
    const props = {
      isLoading: true,
      data: undefined,
    };
    render(<FearAndGreedView {...props} />);
    expect(screen.getByTestId("fear-and-greed-skeleton")).toBeVisible();
  });

  it("returns null when no data and not loading", () => {
    const props = {
      isLoading: false,
      data: undefined,
    };
    const { container } = render(<FearAndGreedView {...props} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("GradientMoodIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the SVG gradient arc", () => {
    const { container } = render(<GradientMoodIndicator value={50} />);
    const path = container.querySelector("path");
    expect(path).toBeVisible();
    expect(path?.getAttribute("stroke")).toBe("url(#paint0_linear_15877_11047)");
  });

  it("renders the white indicator circle", () => {
    const { container } = render(<GradientMoodIndicator value={50} />);
    const circle = container.querySelector("circle");
    expect(circle).toBeVisible();
    expect(circle?.getAttribute("fill")).toBe("white");
  });

  it("displays the initial value as 0", () => {
    const { container } = render(<GradientMoodIndicator value={75} />);
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("0");
  });

  it("animates to the target value", async () => {
    const { container } = render(<GradientMoodIndicator value={75} />);
    const text = container.querySelector("text");

    // Fast-forward through animation
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      expect(text?.textContent).toBe("75");
    });
  });

  it("positions the circle at the left for value 0", () => {
    const { container } = render(<GradientMoodIndicator value={0} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    const circle = container.querySelector("circle");
    const cx = parseFloat(circle?.getAttribute("cx") || "0");

    // At value 0, angle is 180°, so x should be near left side
    expect(cx).toBeLessThan(21.5814);
  });

  it("positions the circle at the right for value 100", async () => {
    const { container } = render(<GradientMoodIndicator value={100} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      const circle = container.querySelector("circle");
      const cx = parseFloat(circle?.getAttribute("cx") || "0");

      // At value 100, angle is 0°, so x should be near right side
      expect(cx).toBeGreaterThan(21.5814);
    });
  });

  it("positions the circle at the center for value 50", async () => {
    const { container } = render(<GradientMoodIndicator value={50} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      const circle = container.querySelector("circle");
      const cx = parseFloat(circle?.getAttribute("cx") || "0");

      // At value 50, angle is 90°, so x should be near center
      expect(cx).toBeCloseTo(21.5814, 1);
    });
  });

  it("updates animation when value changes", async () => {
    const { container, rerender } = render(<GradientMoodIndicator value={25} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      const text = container.querySelector("text");
      expect(text?.textContent).toBe("25");
    });

    rerender(<GradientMoodIndicator value={75} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    await waitFor(() => {
      const text = container.querySelector("text");
      expect(text?.textContent).toBe("75");
    });
  });

  it("displays rounded value during animation", async () => {
    const { container } = render(<GradientMoodIndicator value={50} />);
    const text = container.querySelector("text");

    // Check intermediate values are integers
    act(() => {
      jest.advanceTimersByTime(600);
    });
    await waitFor(() => {
      const value = parseInt(text?.textContent || "0", 10);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(50);
    });
  });
});

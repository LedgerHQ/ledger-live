import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { FearAndGreedView } from "../../FearAndGreed";
import { FearAndGreedIndicator } from "../../FearAndGreed/components/FearAndGreedIndicator";

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

  describe("Dialog behavior", () => {
    it("opens dialog when clicking on the tile", async () => {
      const props = {
        isLoading: false,
        data: { value: 50, classification: "Neutral" },
      };
      const { user } = render(<FearAndGreedView {...props} />);

      const moodTile = screen.getByTestId("fear-and-greed-card");
      await user.click(moodTile);

      expect(screen.getByTestId("fear-and-greed-dialog-content")).toBeVisible();
    });

    it("closes dialog when clicking the close button", async () => {
      const props = {
        isLoading: false,
        data: { value: 50, classification: "Neutral" },
      };
      const { user } = render(<FearAndGreedView {...props} />);

      const moodTile = screen.getByTestId("fear-and-greed-card");
      await user.click(moodTile);

      await waitFor(() => {
        expect(screen.getByTestId("fear-and-greed-dialog-content")).toBeVisible();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("fear-and-greed-dialog-content")).not.toBeInTheDocument();
      });
    });

    it("closes dialog when clicking the CTA button", async () => {
      const props = {
        isLoading: false,
        data: { value: 50, classification: "Neutral" },
      };
      const { user } = render(<FearAndGreedView {...props} />);

      const moodTile = screen.getByTestId("fear-and-greed-card");
      await user.click(moodTile);

      await waitFor(() => {
        expect(screen.getByTestId("fear-and-greed-dialog-content")).toBeVisible();
      });

      const ctaButton = screen.getByTestId("fear-and-greed-dialog-cta");
      await user.click(ctaButton);

      await waitFor(() => {
        expect(screen.queryByTestId("fear-and-greed-dialog-content")).not.toBeInTheDocument();
      });
    });
  });
});

describe("FearAndGreedIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the SVG gradient arc", () => {
    const { container } = render(<FearAndGreedIndicator value={50} />);
    const path = container.querySelector("path");
    expect(path).toBeVisible();
    expect(path?.getAttribute("stroke")).toBe("url(#paint0_linear_15877_11047)");
  });

  it("renders the white indicator circle", () => {
    const { container } = render(<FearAndGreedIndicator value={50} />);
    const circle = container.querySelector("circle");
    expect(circle).toBeVisible();
    expect(circle?.getAttribute("fill")).toBe("white");
  });

  it("displays the initial value as 0", () => {
    const { container } = render(<FearAndGreedIndicator value={75} />);
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("0");
  });

  it("animates to the target value", async () => {
    const { container } = render(<FearAndGreedIndicator value={75} />);
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
    const { container } = render(<FearAndGreedIndicator value={0} />);

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    const circle = container.querySelector("circle");
    const cx = parseFloat(circle?.getAttribute("cx") || "0");

    // At value 0, angle is 180°, so x should be near left side
    expect(cx).toBeLessThan(21.5814);
  });

  it("positions the circle at the right for value 100", async () => {
    const { container } = render(<FearAndGreedIndicator value={100} />);

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
    const { container } = render(<FearAndGreedIndicator value={50} />);

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

  it("displays rounded value during animation", async () => {
    const { container } = render(<FearAndGreedIndicator value={50} />);
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

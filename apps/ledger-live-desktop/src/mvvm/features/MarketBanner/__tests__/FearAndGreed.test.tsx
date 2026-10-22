import React from "react";
import { render, act } from "tests/testSetup";
import { ArcGaugeIndicator } from "LLD/components/ArcGaugeIndicator";

const FEAR_COLOR = "#F87274";
const GREED_COLOR = "#6EC85C";

describe("ArcGaugeIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders the SVG gradient arc", () => {
    const { container } = render(
      <ArcGaugeIndicator value={50} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );
    const path = container.querySelector("path");
    expect(path).toBeVisible();

    const stroke = path?.getAttribute("stroke");
    expect(stroke).toMatch(/^url\(#.+\)$/);
    expect(container.querySelector("linearGradient")).toBeTruthy();
  });

  it("renders the white indicator circle", () => {
    const { container } = render(
      <ArcGaugeIndicator value={50} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );
    const circle = container.querySelector("circle");
    expect(circle).toBeVisible();
    expect(circle?.getAttribute("fill")).toBe("white");
  });

  it("displays the initial value as 0", () => {
    const { container } = render(
      <ArcGaugeIndicator value={75} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("0");
  });

  it("animates to the target value", () => {
    const { container } = render(
      <ArcGaugeIndicator value={75} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );
    const text = container.querySelector("text");

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(text?.textContent).toBe("75");
  });

  it("positions the circle at the left for value 0", () => {
    const { container } = render(
      <ArcGaugeIndicator value={0} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    const circle = container.querySelector("circle");
    const cx = parseFloat(circle?.getAttribute("cx") || "0");

    expect(cx).toBeLessThan(21.5814);
  });

  it("positions the circle at the right for value 100", () => {
    const { container } = render(
      <ArcGaugeIndicator value={100} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    const circle = container.querySelector("circle");
    const cx = parseFloat(circle?.getAttribute("cx") || "0");
    expect(cx).toBeGreaterThan(21.5814);
  });

  it("positions the circle at the center for value 50", () => {
    const { container } = render(
      <ArcGaugeIndicator value={50} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    const circle = container.querySelector("circle");
    const cx = parseFloat(circle?.getAttribute("cx") || "0");
    expect(cx).toBeCloseTo(21.5814, 1);
  });

  it("displays rounded value during animation", () => {
    const { container } = render(
      <ArcGaugeIndicator value={50} startColor={FEAR_COLOR} endColor={GREED_COLOR} />,
    );
    const text = container.querySelector("text");

    act(() => {
      jest.advanceTimersByTime(600);
    });

    const value = parseInt(text?.textContent || "0", 10);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(50);
  });
});

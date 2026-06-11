import { fireEvent } from "@testing-library/react";

export const LUMEN_CHART_TEST_WIDTH = 800;
export const LUMEN_CHART_TEST_HEIGHT = 240;

export function mockLumenChartResizeObserver(width = LUMEN_CHART_TEST_WIDTH): void {
  global.ResizeObserver = class ResizeObserver {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe() {
      this.callback(
        [{ contentRect: { width, height: LUMEN_CHART_TEST_HEIGHT } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }

    unobserve() {}
    disconnect() {}
  };
}

export function mockChartSvgLayout(
  element: Element,
  width = LUMEN_CHART_TEST_WIDTH,
  height = LUMEN_CHART_TEST_HEIGHT,
): void {
  element.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

/** Simulates hovering the chart (Lumen scrubbing listens to mousemove, not click). */
export function hoverChartSvg(
  chartSvg: Element,
  clientX = LUMEN_CHART_TEST_WIDTH / 2,
  clientY = LUMEN_CHART_TEST_HEIGHT / 2,
): void {
  mockChartSvgLayout(chartSvg);
  fireEvent.mouseMove(chartSvg, { clientX, clientY });
}

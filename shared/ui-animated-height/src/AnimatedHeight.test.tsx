import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AnimatedHeight, useAnimatedHeightCapped } from "./AnimatedHeight";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

// jsdom lays nothing out: a box is as tall as its `data-h`, or as its children together.
function mockOffsetHeight() {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement): number {
      if (this.dataset.h !== undefined) return Number(this.dataset.h);
      return [...this.children].reduce(
        (total, child) => total + (child instanceof HTMLElement ? child.offsetHeight : 0),
        0,
      );
    },
  });
}

function CappedProbe() {
  return <p data-h="0">{useAnimatedHeightCapped() ? "capped" : "fits"}</p>;
}

describe("AnimatedHeight", () => {
  const observed: Element[] = [];
  const originalResizeObserver = global.ResizeObserver;
  let notifyResize: () => void;

  beforeEach(() => {
    observed.length = 0;
    mockOffsetHeight();
    global.ResizeObserver = class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    }
  });

  it("should track the content but not fields that resize themselves", () => {
    render(
      <AnimatedHeight header={<h1>Send</h1>}>
        <input aria-label="Amount" />
        <p>Terms</p>
      </AnimatedHeight>,
    );

    expect(observed.some(element => element instanceof HTMLInputElement)).toBe(false);
    expect(observed.some(element => element instanceof HTMLParagraphElement)).toBe(true);
  });

  it("should animate to the new content height when the content changes", () => {
    render(
      <AnimatedHeight>
        <div data-testid="step" data-h="200" />
      </AnimatedHeight>,
    );
    const step = screen.getByTestId("step");
    const outer = step.parentElement?.parentElement as HTMLElement;

    expect(outer).toHaveStyle({ height: "200px", overflow: "visible" });

    step.dataset.h = "320";
    act(() => notifyResize());

    expect(outer).toHaveStyle({ height: "320px", overflow: "hidden" });

    // jsdom has no TransitionEvent, so the property name is set on a plain event.
    fireEvent(
      outer,
      Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "height" }),
    );

    expect(outer).toHaveStyle({ overflow: "visible" });
  });

  it("should stop at the dialog max height and let the content scroll", () => {
    render(
      <div style={{ maxHeight: "100px" }}>
        <AnimatedHeight>
          <div data-h="300" />
          <CappedProbe />
        </AnimatedHeight>
      </div>,
    );

    expect(screen.getByText("capped")).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "tests/testSetup";
import { AnimatedHeight } from "../AnimatedHeight";

describe("AnimatedHeight", () => {
  const observed: Element[] = [];
  const originalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    observed.length = 0;
    global.ResizeObserver = class {
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  it("should keep tracking the message when the amount field resizes itself", () => {
    render(
      <AnimatedHeight header={<h1>Send</h1>}>
        <input aria-label="Amount" />
        <p>Amount too low</p>
      </AnimatedHeight>,
    );

    expect(observed.some(element => element instanceof HTMLInputElement)).toBe(false);
    expect(observed.some(element => element instanceof HTMLParagraphElement)).toBe(true);
  });
});

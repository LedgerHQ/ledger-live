import React from "react";
import { render, cleanup } from "@tests/test-renderer";
import { track } from "../segment";
import Track from "../Track";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

const eventName = "Test Event";
const testProps = { testProp: "test value" };
const updatedProps = { testProp: "new test value" };
const finalProps = { testProp: "another value" };

describe("Track component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it("should track event on mount when #onMount=true", () => {
    render(<Track event={eventName} onMount={true} {...testProps} />);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(eventName, testProps);
  });

  it("should not track event on mount when #onMount=false", () => {
    render(<Track event={eventName} onMount={false} {...testProps} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("should not track event initially for #onUnmount=true", () => {
    render(<Track event={eventName} onUnmount={true} {...testProps} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("should track event on unmount when #onUnmount=true", () => {
    const { unmount } = render(<Track event={eventName} onUnmount={true} {...testProps} />);
    unmount();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(eventName, testProps);
  });

  it("should not track event on unmount when #onUnmount=false", () => {
    const { unmount } = render(<Track event={eventName} onUnmount={false} {...testProps} />);
    unmount();
    expect(track).not.toHaveBeenCalled();
  });

  it("should not track on initial render for #onUpdate=true", () => {
    render(<Track event={eventName} onUpdate={true} {...testProps} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("should not track when rerendering with the same props for #onUpdate=true", () => {
    const { rerender } = render(<Track event={eventName} onUpdate={true} {...testProps} />);
    rerender(<Track event={eventName} onUpdate={true} {...testProps} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("should track when props change for #onUpdate=true", () => {
    const { rerender } = render(<Track event={eventName} onUpdate={true} {...testProps} />);
    rerender(<Track event={eventName} onUpdate={true} {...updatedProps} />);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(eventName, updatedProps);
  });

  it("should track with final props after multiple updates for #onUpdate=true", () => {
    const { rerender } = render(<Track event={eventName} onUpdate={true} {...testProps} />);
    rerender(<Track event={eventName} onUpdate={true} {...updatedProps} />);
    expect(track).toHaveBeenCalledTimes(1);

    rerender(<Track event={eventName} onUpdate={true} {...finalProps} />);
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith(eventName, finalProps);
  });

  it("should not track when props change for #onUpdate=false", () => {
    const { rerender } = render(<Track event={eventName} onUpdate={false} {...testProps} />);
    rerender(<Track event={eventName} onUpdate={false} {...updatedProps} />);
    expect(track).not.toHaveBeenCalled();
  });

  it("should track on mount with all tracking options enabled", () => {
    render(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...testProps} />,
    );
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(eventName, testProps);
  });

  it("should not track when rerendering with same props with all options enabled", () => {
    const { rerender } = render(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...testProps} />,
    );
    rerender(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...testProps} />,
    );
    expect(track).not.toHaveBeenCalledTimes(2);
  });

  it("should track when props change with all options enabled", () => {
    const { rerender } = render(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...testProps} />,
    );
    expect(track).toHaveBeenCalledTimes(1);
    rerender(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...updatedProps} />,
    );
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith(eventName, updatedProps);
  });

  it("should track on unmount with all options enabled", () => {
    const { unmount, rerender } = render(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...testProps} />,
    );
    expect(track).toHaveBeenCalledTimes(1);
    rerender(
      <Track event={eventName} onMount={true} onUpdate={true} onUnmount={true} {...updatedProps} />,
    );
    expect(track).toHaveBeenCalledTimes(2);

    unmount();
    expect(track).toHaveBeenCalledTimes(3);
    expect(track).toHaveBeenCalledWith(eventName, updatedProps);
  });
});

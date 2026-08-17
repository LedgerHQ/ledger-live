import React from "react";
import { cleanup, render } from "@testing-library/react";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { Track } from "./Track";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
});

afterEach(cleanup);

describe("Track", () => {
  it("sends the event on mount when asked to", () => {
    render(<Track onMount event="Discoverability - Prompt" language="en" />);

    expect(track).toHaveBeenCalledWith("Discoverability - Prompt", {
      page: undefined,
      language: "en",
    });
  });

  it("sends nothing on mount by default", () => {
    render(<Track event="Discoverability - Prompt" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("sends the event on unmount when asked to", () => {
    const { unmount } = render(<Track onUnmount event="Drawer Closed" />);
    expect(track).not.toHaveBeenCalled();

    unmount();

    expect(track).toHaveBeenCalledWith("Drawer Closed", { page: undefined });
  });

  it("reports the properties the component had when it went away", () => {
    const { rerender, unmount } = render(<Track onUnmount event="Drawer Closed" step="first" />);
    rerender(<Track onUnmount event="Drawer Closed" step="last" />);

    unmount();

    expect(track).toHaveBeenCalledWith("Drawer Closed", {
      page: undefined,
      step: "last",
    });
  });

  it("sends the event when a property changes and onUpdate is set", () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="favourites" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Filter Changed", {
      page: undefined,
      filter: "favourites",
    });
  });

  it("sends nothing when re-rendered with equal properties", () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="all" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("keeps the lifecycle flags out of the payload", () => {
    render(<Track onMount onUnmount onUpdate event="Some Event" foo="bar" />);

    expect(track).toHaveBeenCalledWith("Some Event", { page: undefined, foo: "bar" });
  });

  it("sends a mandatory event even when consent is refused", () => {
    setTrackingSelector(() => false);

    render(<Track onMount mandatory event="Analytics Consent - Prompt" />);

    expect(track).toHaveBeenCalledWith("Analytics Consent - Prompt", { page: undefined });
  });

  it("sends nothing without consent when the event is not mandatory", () => {
    setTrackingSelector(() => false);

    render(<Track onMount event="Some Event" />);

    expect(track).not.toHaveBeenCalled();
  });
});

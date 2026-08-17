import React from "react";
import { cleanup, render } from "@testing-library/react";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { currentRouteNameRef, previousRouteNameRef } from "@shared/analytics/screenRefs";
import { TrackPage } from "./TrackPage";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

afterEach(cleanup);

describe("TrackPage", () => {
  it("sends a page event named after the category and name on mount", () => {
    render(<TrackPage category="Analytics Consent" name="Optional" flow="test-flow" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Page Analytics Consent Optional", {
      source: undefined,
      flow: "test-flow",
    });
  });

  it("becomes the source of the next page event", () => {
    render(<TrackPage category="Portfolio" />);
    cleanup();
    render(<TrackPage category="Market" />);

    expect(currentRouteNameRef.current).toBe("Market");
    expect(track).toHaveBeenLastCalledWith("Page Market", { source: "Portfolio" });
  });

  it("leaves the current page untouched when it does not refresh the source", () => {
    currentRouteNameRef.current = "Portfolio";

    render(<TrackPage category="Some Drawer" refreshSource={false} />);

    expect(currentRouteNameRef.current).toBe("Portfolio");
  });

  it("sends nothing more when re-rendered with the same properties", () => {
    const { rerender } = render(<TrackPage category="Portfolio" />);
    rerender(<TrackPage category="Portfolio" />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends a mandatory page event even when consent is refused", () => {
    setTrackingSelector(() => false);

    render(<TrackPage category="Analytics Consent" name="Mandatory" mandatory />);

    expect(track).toHaveBeenCalledWith("Page Analytics Consent Mandatory", {
      source: undefined,
    });
  });

  it("updates the route refs even when consent is refused", () => {
    setTrackingSelector(() => false);

    render(<TrackPage category="Portfolio" />);

    expect(track).not.toHaveBeenCalled();
    expect(currentRouteNameRef.current).toBe("Portfolio");
  });
});

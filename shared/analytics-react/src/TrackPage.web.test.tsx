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

  it("sends nothing more when re-rendered with a changed property", () => {
    const { rerender } = render(<TrackPage category="Portfolio" balance={1} />);
    rerender(<TrackPage category="Portfolio" balance={2} />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Page Portfolio", { source: undefined, balance: 1 });
  });

  it("sends nothing more when re-rendered with a new but equal object property", () => {
    const { rerender } = render(<TrackPage category="Portfolio" meta={{ tab: "assets" }} />);
    rerender(<TrackPage category="Portfolio" meta={{ tab: "assets" }} />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  // A page view belongs to the mount. Swapping the category on a mounted <TrackPage> is not how the
  // component is meant to be used, so it deliberately stays silent; render one per page instead.
  it("sends nothing more when the category changes on a mounted component", () => {
    const { rerender } = render(<TrackPage category="Portfolio" />);
    rerender(<TrackPage category="Market" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Page Portfolio", { source: undefined });
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

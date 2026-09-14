import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import {
  currentRouteNameRef,
  previousRouteNameRef,
  setAnalytics,
  setEnabledFn,
} from "@shared/analytics";
import { TrackPage } from "./TrackPage.web";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setEnabledFn(() => true);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

afterEach(cleanup);

describe("TrackPage", () => {
  it("sends a page event named after the category and name on mount", async () => {
    render(<TrackPage category="Analytics Consent" name="Optional" flow="test-flow" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Page Analytics Consent Optional", {
      flow: "test-flow",
    });
  });

  it("becomes the source of the next page event", async () => {
    render(<TrackPage category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    cleanup();
    render(<TrackPage category="Market" />);

    expect(currentRouteNameRef.current).toBe("Market");
    await waitFor(() => {
      expect(track).toHaveBeenLastCalledWith("Page Market", {
        source: "Portfolio",
      });
    });
  });

  it("leaves the current page untouched when it does not refresh the source", async () => {
    currentRouteNameRef.current = "Portfolio";

    render(<TrackPage category="Some Drawer" refreshSource={false} />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(currentRouteNameRef.current).toBe("Portfolio");
  });

  it("sends nothing more when re-rendered with the same properties", async () => {
    const { rerender } = render(<TrackPage category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackPage category="Portfolio" />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends nothing more when re-rendered with a changed property", async () => {
    const { rerender } = render(<TrackPage category="Portfolio" balance={1} />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackPage category="Portfolio" balance={2} />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Page Portfolio", {
      balance: 1,
    });
  });

  it("sends nothing more when re-rendered with a new but equal object property", async () => {
    const { rerender } = render(<TrackPage category="Portfolio" meta={{ tab: "assets" }} />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackPage category="Portfolio" meta={{ tab: "assets" }} />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends nothing more when the category changes on a mounted component", async () => {
    const { rerender } = render(<TrackPage category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackPage category="Market" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Page Portfolio", {});
  });

  it("sends a mandatory page event even when consent is refused", async () => {
    setEnabledFn(() => false);

    render(<TrackPage category="Analytics Consent" name="Mandatory" mandatory />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Page Analytics Consent Mandatory", {});
    });
  });

  it("does not update route refs when consent is refused", () => {
    setEnabledFn(() => false);

    render(<TrackPage category="Portfolio" />);

    expect(track).not.toHaveBeenCalled();
    expect(currentRouteNameRef.current).toBeUndefined();
  });
});

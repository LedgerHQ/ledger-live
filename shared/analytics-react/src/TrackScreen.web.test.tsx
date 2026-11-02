import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import {
  getCurrentTrackingPage,
  resetTrackingPages,
  setAnalytics,
  setEnabledFn,
  setTrackingSource,
} from "@shared/analytics";
import { TrackScreen } from "./TrackScreen";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setEnabledFn(() => true);
  resetTrackingPages();
});

afterEach(cleanup);

describe("TrackScreen", () => {
  it("sends a page event named after the category and name on mount", async () => {
    render(<TrackScreen category="Analytics Consent" name="Optional" flow="test-flow" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Page Analytics Consent Optional", {
      flow: "test-flow",
    });
  });

  it("keeps the native-only avoidDuplicates prop out of the event properties", async () => {
    render(<TrackScreen category="Portfolio" flow="test-flow" avoidDuplicates />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Page Portfolio", { flow: "test-flow" });
  });

  it("becomes the source of the next page event", async () => {
    render(<TrackScreen category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    cleanup();
    render(<TrackScreen category="Market" />);

    expect(getCurrentTrackingPage()).toBe("Market");
    await waitFor(() => {
      expect(track).toHaveBeenLastCalledWith("Page Market", {
        source: "Portfolio",
      });
    });
  });

  it("leaves the current page untouched when it does not refresh the source", async () => {
    setTrackingSource("Portfolio");

    render(<TrackScreen category="Some Drawer" refreshSource={false} />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(getCurrentTrackingPage()).toBe("Portfolio");
  });

  it("sends nothing more when re-rendered with the same properties", async () => {
    const { rerender } = render(<TrackScreen category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackScreen category="Portfolio" />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends another page event when re-rendered with a changed property", async () => {
    const { rerender } = render(<TrackScreen category="Market" currencyId={"btc"} />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });

    expect(track).toHaveBeenLastCalledWith("Page Market", {
      currencyId: "btc",
    });

    rerender(<TrackScreen category="Market" currencyId={"eth"} />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(2);
    });

    expect(track).toHaveBeenLastCalledWith("Page Market", {
      currencyId: "eth",
      source: "Market",
    });
  });

  it("sends nothing more when re-rendered with a new but equal object property", async () => {
    const { rerender } = render(<TrackScreen category="Portfolio" meta={{ tab: "assets" }} />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackScreen category="Portfolio" meta={{ tab: "assets" }} />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("sends another page event when the category changes on a mounted component", async () => {
    const { rerender } = render(<TrackScreen category="Portfolio" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    rerender(<TrackScreen category="Market" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(2);
    });
    expect(track).toHaveBeenLastCalledWith("Page Market", {
      source: "Portfolio",
    });
  });

  it("sends a single page event when StrictMode mounts the component twice", async () => {
    render(<TrackScreen category="Portfolio" />, { wrapper: React.StrictMode });

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Page Portfolio", {});
  });

  it("sends a mandatory page event even when consent is refused", async () => {
    setEnabledFn(() => false);

    render(<TrackScreen category="Analytics Consent" name="Mandatory" mandatory />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Page Analytics Consent Mandatory", {});
    });
  });

  it("sends a mandatory page event when mandatory becomes true on rerender", async () => {
    setEnabledFn(() => false);

    const { rerender } = render(
      <TrackScreen category="Analytics Consent" name="Mandatory" flow="test-flow" />,
    );
    expect(track).not.toHaveBeenCalled();

    rerender(
      <TrackScreen category="Analytics Consent" name="Mandatory" flow="test-flow" mandatory />,
    );

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith(
      "Page Analytics Consent Mandatory",
      expect.objectContaining({
        flow: "test-flow",
      }),
    );
  });
});

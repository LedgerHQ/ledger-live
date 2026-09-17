import React from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { setAnalytics, setEnabledFn } from "@shared/analytics";
import { Track } from ".";

const track = jest.fn();

/** Gives unmount a chance to fire, so a test can assert on the final count. */
const flushDeferredEvents = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setEnabledFn(() => true);
});

afterEach(cleanup);

describe("Track", () => {
  it("tracks the on-mount event once (even if the component is re-evaluated)", async () => {
    const { rerender } = render(<Track onMount event="Discoverability - Prompt" language="en" />);
    rerender(<Track onMount event="Discoverability - Prompt" language="en" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Discoverability - Prompt", {
      language: "en",
    });
  });

  it("tracks nothing on mount by default", () => {
    render(<Track event="Discoverability - Prompt" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("tracks the event unmount event", async () => {
    const { unmount } = render(<Track onUnmount event="Drawer Closed" example="data" />);
    expect(track).not.toHaveBeenCalled();

    unmount();

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Drawer Closed", {
      example: "data",
    });
  });

  it("sends the unmount event only on the real unmount when StrictMode mounts twice", async () => {
    const { unmount } = render(<Track onMount onUnmount event="Drawer Closed" example="data" />, {
      wrapper: React.StrictMode,
    });

    await flushDeferredEvents();
    expect(track).toHaveBeenCalledTimes(1);

    unmount();

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(2);
    });
    expect(track).toHaveBeenLastCalledWith("Drawer Closed", {
      example: "data",
    });
  });

  it("sends no update event when StrictMode replays the mount effects", async () => {
    render(<Track onUpdate event="Filter Changed" filter="all" />, { wrapper: React.StrictMode });

    await flushDeferredEvents();
    expect(track).not.toHaveBeenCalled();
  });

  it("tracks the event when a property changes and onUpdate is set", async () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="favourites" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Filter Changed", {
      filter: "favourites",
    });
  });

  it("still tracks a property change under StrictMode", async () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />, {
      wrapper: React.StrictMode,
    });
    rerender(<Track onUpdate event="Filter Changed" filter="favourites" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Filter Changed", {
      filter: "favourites",
    });
  });

  it("sends nothing when re-rendered with equal properties", () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="all" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("compares properties shallowly, so a new but equal object counts as a change", async () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter={{ tag: "all" }} />);
    rerender(<Track onUpdate event="Filter Changed" filter={{ tag: "all" }} />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
  });

  it("sends nothing on re-render when onUpdate is not set", () => {
    const { rerender } = render(<Track event="Filter Changed" filter="all" />);
    rerender(<Track event="Filter Changed" filter="favourites" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("keeps the lifecycle flags out of the payload", async () => {
    render(<Track onMount onUnmount onUpdate event="Some Event" foo="bar" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Some Event", {
        foo: "bar",
      });
    });
  });

  it("sends a mandatory event even when consent is refused", async () => {
    setEnabledFn(() => false);

    render(<Track onMount mandatory event="Analytics Consent - Prompt" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Analytics Consent - Prompt", {});
    });
  });

  it("sends nothing without consent when the event is not mandatory", () => {
    setEnabledFn(() => false);

    render(<Track onMount event="Some Event" />);

    expect(track).not.toHaveBeenCalled();
  });
});

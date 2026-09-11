jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { setAnalytics, setEnabledFn } from "@shared/analytics";
import { Track } from ".";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setEnabledFn(() => true);
});

describe("Track (native entry point)", () => {
  it("tracks the on-mount event once (even if the component is re-evaluated)", async () => {
    const { rerender } = render(<Track onMount event="Some Event" foo="bar" />);
    rerender(<Track onMount event="Some Event" foo="bar" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
    expect(track).toHaveBeenCalledWith("Some Event", {
      foo: "bar",
    });
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
});

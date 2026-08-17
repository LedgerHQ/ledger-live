// The native barrel also pulls in <TrackScreen>, whose @react-navigation/native import ships as
// untransformed ESM. <Track> never uses it.
jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import React from "react";
import { render } from "@testing-library/react-native";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { Track } from "./index.native";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
});

describe("Track (native entry point)", () => {
  it("sends the event on mount when asked to", () => {
    render(<Track onMount event="Some Event" foo="bar" />);

    expect(track).toHaveBeenCalledWith("Some Event", { page: undefined, foo: "bar" });
  });

  it("sends the event when a property changes and onUpdate is set", () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="favourites" />);

    expect(track).toHaveBeenCalledWith("Filter Changed", {
      page: undefined,
      filter: "favourites",
    });
  });
});

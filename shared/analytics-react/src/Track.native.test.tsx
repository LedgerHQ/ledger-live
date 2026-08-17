// The native barrel also pulls in <TrackScreen>, whose @react-navigation/native import ships as
// untransformed ESM. <Track> never uses it.
jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import React from "react";
import { render } from "@testing-library/react-native";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { Track } from "./index.native";

const transportTrack = jest.fn();

beforeEach(() => {
  transportTrack.mockClear();
  setAnalytics({ track: transportTrack });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
});

describe("Track (native entry point)", () => {
  it("sends the event on mount when asked to", () => {
    render(<Track onMount event="Some Event" foo="bar" />);

    expect(transportTrack).toHaveBeenCalledWith("Some Event", { page: undefined, foo: "bar" });
  });
});

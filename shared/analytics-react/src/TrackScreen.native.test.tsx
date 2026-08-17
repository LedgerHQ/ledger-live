jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import React from "react";
import { render } from "@testing-library/react-native";
import { useIsFocused } from "@react-navigation/native";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { currentRouteNameRef, previousRouteNameRef } from "@shared/analytics/screenRefs";
import { TrackScreen } from "./TrackScreen.native";

const mockUseIsFocused = useIsFocused as jest.Mock;
const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  mockUseIsFocused.mockReturnValue(true);
  setAnalytics({ track });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

describe("TrackScreen", () => {
  it("sends a screen event named after the category and name once focused", () => {
    render(<TrackScreen category="Asset" name="Bitcoin" ticker="BTC" />);

    expect(track).toHaveBeenCalledWith("Page Asset Bitcoin", {
      source: undefined,
      ticker: "BTC",
    });
  });

  it("sends nothing while the screen is not focused", () => {
    mockUseIsFocused.mockReturnValue(false);

    render(<TrackScreen category="Asset" name="Bitcoin" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("sends the event when an unfocused screen gains focus", () => {
    mockUseIsFocused.mockReturnValue(false);
    const { rerender } = render(<TrackScreen category="Asset" name="Bitcoin" />);

    mockUseIsFocused.mockReturnValue(true);
    rerender(<TrackScreen category="Asset" name="Bitcoin" />);

    expect(track).toHaveBeenCalledWith("Page Asset Bitcoin", { source: undefined });
  });

  it("suppresses a remount of the same screen when avoiding duplicates", () => {
    render(<TrackScreen category="Portfolio" avoidDuplicates />).unmount();
    render(<TrackScreen category="Portfolio" avoidDuplicates />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("emits a remount of the same screen by default", () => {
    render(<TrackScreen category="Market" />).unmount();
    render(<TrackScreen category="Market" />);

    expect(track).toHaveBeenCalledTimes(2);
  });

  it("becomes the source of the next screen event", () => {
    render(<TrackScreen category="Portfolio" />).unmount();
    render(<TrackScreen category="Market" />);

    expect(currentRouteNameRef.current).toBe("Market");
    expect(track).toHaveBeenLastCalledWith("Page Market", { source: "Portfolio" });
  });

  it("sends a mandatory screen event even when consent is refused", () => {
    setTrackingSelector(() => false);

    render(<TrackScreen category="Analytics Consent" mandatory />);

    expect(track).toHaveBeenCalledWith("Page Analytics Consent", { source: undefined });
  });
});

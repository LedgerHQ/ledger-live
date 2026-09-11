jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  currentRouteNameRef,
  previousRouteNameRef,
  setAnalytics,
  setEnabledFn,
} from "@shared/analytics";
import { TrackScreen } from "./TrackScreen.native";

const mockUseIsFocused = useIsFocused as jest.Mock;
const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  mockUseIsFocused.mockReturnValue(true);
  setAnalytics({ track });
  setEnabledFn(() => true);
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

describe("TrackScreen", () => {
  it("sends a screen event named after the category and name once focused", async () => {
    render(<TrackScreen category="Asset" name="Bitcoin" ticker="BTC" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Page Asset Bitcoin", {
        ticker: "BTC",
      });
    });
  });

  it("sends nothing while the screen is not focused", () => {
    mockUseIsFocused.mockReturnValue(false);

    render(<TrackScreen category="Asset" name="Bitcoin" />);

    expect(track).not.toHaveBeenCalled();
  });

  it("sends the event when an unfocused screen gains focus", async () => {
    mockUseIsFocused.mockReturnValue(false);
    const { rerender } = render(<TrackScreen category="Asset" name="Bitcoin" />);

    mockUseIsFocused.mockReturnValue(true);
    rerender(<TrackScreen category="Asset" name="Bitcoin" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Page Asset Bitcoin", {});
    });
  });

  it("sends nothing more when a focused screen loses focus", async () => {
    const { rerender } = render(<TrackScreen category="Asset" name="Bitcoin" />);
    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });

    mockUseIsFocused.mockReturnValue(false);
    rerender(<TrackScreen category="Asset" name="Bitcoin" />);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("suppresses a remount of the same screen when avoiding duplicates", async () => {
    render(<TrackScreen category="Portfolio" avoidDuplicates />).unmount();
    render(<TrackScreen category="Portfolio" avoidDuplicates />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(1);
    });
  });

  it("emits a remount of the same screen by default", async () => {
    render(<TrackScreen category="Market" />).unmount();
    render(<TrackScreen category="Market" />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledTimes(2);
    });
  });

  it("becomes the source of the next screen event", async () => {
    render(<TrackScreen category="Portfolio" />).unmount();
    render(<TrackScreen category="Market" />);

    expect(currentRouteNameRef.current).toBe("Market");
    await waitFor(() => {
      expect(track).toHaveBeenLastCalledWith("Page Market", {
        source: "Portfolio",
      });
    });
  });

  it("sends a mandatory screen event even when consent is refused", async () => {
    setEnabledFn(() => false);

    render(<TrackScreen category="Analytics Consent" mandatory />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("Page Analytics Consent", {});
    });
  });
});

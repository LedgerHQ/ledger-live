import { renderHook } from "@testing-library/react";
import { track } from "~/renderer/analytics/segment";
import { usePayTabFeatureTour } from "./usePayTabFeatureTour";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockedTrack = jest.mocked(track);

describe("usePayTabFeatureTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build the feature tour content with the three feature rows", () => {
    const { result } = renderHook(() => usePayTabFeatureTour());

    expect(result.current.title).toBeTruthy();
    expect(result.current.description).toBeTruthy();
    expect(result.current.ctaLabel).toBeTruthy();
    expect(result.current.rows.map(row => row.icon)).toEqual(["Globe", "Chart5", "CreditCard"]);
    result.current.rows.forEach(row => {
      expect(row.title).toBeTruthy();
      expect(row.description).toBeTruthy();
    });
  });

  it("should wire the tour analytics callbacks to track", () => {
    const { result } = renderHook(() => usePayTabFeatureTour());

    result.current.onTrackScreen?.("Page card feature intro");
    expect(mockedTrack).toHaveBeenCalledWith("Page card feature intro");

    result.current.onTrackEvent?.("button_clicked", { button: "got it" });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "got it" });
  });
});

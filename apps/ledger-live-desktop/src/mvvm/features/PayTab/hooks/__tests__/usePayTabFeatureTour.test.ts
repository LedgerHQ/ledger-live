import { renderHook } from "@testing-library/react";
import { track } from "~/renderer/analytics/segment";
import { usePayTabFeatureTour } from "../usePayTabFeatureTour";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockedTrack = jest.mocked(track);

describe("usePayTabFeatureTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should wire the tour analytics callbacks to track", () => {
    const { result } = renderHook(() => usePayTabFeatureTour());

    result.current.onTrackScreen?.("Page card feature intro");
    expect(mockedTrack).toHaveBeenCalledWith("Page card feature intro");

    result.current.onTrackEvent?.("button_clicked", { button: "got it" });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "got it" });
  });
});

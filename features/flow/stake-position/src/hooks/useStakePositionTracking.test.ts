import { renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import { useStakePositionTracking } from "./useStakePositionTracking";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const mockTrack = jest.mocked(track);
const mockTrackPage = jest.mocked(trackPage);

const FLOW_PROPS = { flow: "stake", currency: "SOL", source: "earn" };
const ALLOWED_PROPS = ["flow", "currency", "source", "position_status", "action", "button", "page"];

function renderTracking() {
  return renderHook(() => useStakePositionTracking({ origin: "earn", ticker: "SOL" })).result
    .current;
}

describe("useStakePositionTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track the details page with the status of the position", () => {
    renderTracking().trackStep({ page: "details", positionStatus: "active" });

    expect(mockTrackPage).toHaveBeenCalledWith({
      category: "Stake position",
      name: "Details",
      props: { ...FLOW_PROPS, position_status: "active" },
    });
  });

  it("should track the confirmation page with its exit", () => {
    renderTracking().trackStep({ page: "confirm", action: "withdraw" });

    expect(mockTrackPage).toHaveBeenCalledWith({
      category: "Stake position",
      name: "Confirm",
      props: { ...FLOW_PROPS, action: "withdraw" },
    });
  });

  it("should track the not found page", () => {
    renderTracking().trackStep({ page: "notFound" });

    expect(mockTrackPage).toHaveBeenCalledWith({
      category: "Stake position",
      name: "Not found",
      props: FLOW_PROPS,
    });
  });

  it("should track a button of the details page", () => {
    renderTracking().trackButton("deactivate", "details");

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      ...FLOW_PROPS,
      button: "deactivate",
      page: "Stake position details",
    });
  });

  it("should track the confirmation of an exit with the exit", () => {
    renderTracking().trackButton("confirm", "confirm", "withdraw");

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      ...FLOW_PROPS,
      button: "confirm",
      page: "Stake position confirm",
      action: "withdraw",
    });
  });

  it("should send no address, amount or validator", () => {
    const tracking = renderTracking();

    tracking.trackStep({ page: "details", positionStatus: "inactive" });
    tracking.trackButton("withdraw_all", "details");
    tracking.trackButton("close", "notFound");

    const sentProps = [
      ...mockTrackPage.mock.calls.map(([page]) => page.props),
      ...mockTrack.mock.calls.map(([, props]) => props),
    ];
    for (const props of sentProps) {
      expect(ALLOWED_PROPS).toEqual(expect.arrayContaining(Object.keys(props ?? {})));
    }
  });

  it("should leave tx_intent, tx_terminal and the Segment completion to the host's lifecycle seam", () => {
    const tracking = renderTracking();

    tracking.trackButton("earn_more", "details");
    tracking.trackButton("confirm", "confirm", "deactivate");
    tracking.trackButton("back", "confirm");

    expect(new Set(mockTrack.mock.calls.map(([event]) => event))).toEqual(
      new Set(["button_clicked"]),
    );
  });
});

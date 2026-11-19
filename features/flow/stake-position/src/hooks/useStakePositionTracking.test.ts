import { renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import type { StakePositionOrigin } from "../types";
import { useStakePositionTracking } from "./useStakePositionTracking";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const mockTrack = jest.mocked(track);
const mockTrackPage = jest.mocked(trackPage);

const FLOW_PROPS = { flow: "stake", currency: "SOL", source: "earn" };
const ALLOWED_PROPS = [
  "flow",
  "currency",
  "source",
  "position_status",
  "action",
  "reason",
  "button",
  "page",
];

function renderTracking(origin: StakePositionOrigin = "earn") {
  return renderHook(() => useStakePositionTracking({ origin, ticker: "SOL" })).result.current;
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

  it.each([
    ["confirm", "Confirm"],
    ["success", "Success"],
    ["failure", "Failure"],
  ] as const)("should track the %s page with its exit", (page, name) => {
    renderTracking().trackStep({ page, action: "withdraw" });

    expect(mockTrackPage).toHaveBeenCalledWith({
      category: "Stake position",
      name,
      props: { ...FLOW_PROPS, action: "withdraw" },
    });
  });

  it.each(["not_found", "load_error"] as const)(
    "should track the unavailable page with its %s reason",
    reason => {
      renderTracking().trackStep({ page: "unavailable", reason });

      expect(mockTrackPage).toHaveBeenCalledWith({
        category: "Stake position",
        name: "Unavailable",
        props: { ...FLOW_PROPS, reason },
      });
    },
  );

  it("should name a wallet screen as the source of a position it opened", () => {
    renderTracking("account").trackStep({ page: "details", positionStatus: "inactive" });

    expect(mockTrackPage).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ source: "account" }) }),
    );
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
    const tracking = renderTracking("account");

    tracking.trackStep({ page: "details", positionStatus: "inactive" });
    tracking.trackStep({ page: "unavailable", reason: "load_error" });
    tracking.trackButton("withdraw", "details");
    tracking.trackButton("view_transaction", "success", "withdraw");
    tracking.trackButton("try_again", "failure", "deactivate");
    tracking.trackButton("retry_load", "unavailable");
    tracking.trackButton("close", "unavailable");

    const sentProps = [
      ...mockTrackPage.mock.calls.map(([page]) => page.props),
      ...mockTrack.mock.calls.map(([, props]) => props),
    ];
    for (const props of sentProps) {
      expect(ALLOWED_PROPS).toEqual(expect.arrayContaining(Object.keys(props ?? {})));
    }
  });

  it("should leave the transaction events to the host's lifecycle seam", () => {
    const tracking = renderTracking();

    tracking.trackButton("earn_more", "details");
    tracking.trackButton("confirm", "confirm", "deactivate");
    tracking.trackButton("close", "confirm", "deactivate");

    expect(new Set(mockTrack.mock.calls.map(([event]) => event))).toEqual(
      new Set(["button_clicked"]),
    );
  });
});

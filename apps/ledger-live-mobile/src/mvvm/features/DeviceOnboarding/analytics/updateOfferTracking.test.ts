import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import { unseededProps } from "@features/platform-device-onboarding-analytics";
import { trackUpdateOfferEvent } from "./updateOfferTracking";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const funnelProps = unseededProps(DeviceModelId.STAX, null);

describe("trackUpdateOfferEvent", () => {
  it("should send each OS update sheet as the spec page and each answer as the spec button", () => {
    trackUpdateOfferEvent({ type: "shown", sheet: "offer" }, funnelProps);
    trackUpdateOfferEvent({ type: "pressed", sheet: "offer", button: "update" }, funnelProps);
    trackUpdateOfferEvent({ type: "pressed", sheet: "offer", button: "close" }, funnelProps);
    trackUpdateOfferEvent({ type: "shown", sheet: "confirmSkip" }, funnelProps);
    trackUpdateOfferEvent({ type: "pressed", sheet: "confirmSkip", button: "update" }, funnelProps);
    trackUpdateOfferEvent({ type: "pressed", sheet: "confirmSkip", button: "skip" }, funnelProps);

    expect(jest.mocked(trackPage).mock.calls.map(([page]) => page.category)).toEqual([
      "OS update required",
      "OS update required refusal screen",
    ]);
    expect(
      jest
        .mocked(track)
        .mock.calls.map(([, props]) => (props as Record<string, unknown> | undefined)?.button),
    ).toEqual(["Continue", "close", "Install Ledger OS update", "Skip Ledger OS update"]);
  });

  it("should name the sheet a click comes from, as it may not be the current page", () => {
    jest.mocked(track).mockClear();
    trackUpdateOfferEvent({ type: "pressed", sheet: "offer", button: "update" }, funnelProps);
    trackUpdateOfferEvent({ type: "pressed", sheet: "confirmSkip", button: "skip" }, funnelProps);

    expect(
      jest.mocked(track).mock.calls.map(([, props]) => (props as { page?: string }).page),
    ).toEqual(["OS update required", "OS update required refusal screen"]);
  });
});

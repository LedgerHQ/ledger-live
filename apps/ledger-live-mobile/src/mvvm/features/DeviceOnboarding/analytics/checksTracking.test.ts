import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track } from "@shared/analytics";
import { onboardingButtons, unseededProps } from "@features/platform-device-onboarding-analytics";
import { unseededChecksTracking } from "./checksTracking";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

const funnelProps = unseededProps(DeviceModelId.STAX, null);

describe("unseededChecksTracking", () => {
  it("should send the OS update sheets and clicks with the unseeded props", () => {
    const tracking = unseededChecksTracking(funnelProps);

    tracking.trackClick(onboardingButtons.installUpdate);

    expect(tracking.funnelProps).toBe(funnelProps);
    expect(tracking.screensFor(null)).toEqual([]);
    expect(tracking.screensFor("offerSheet").map(({ tracking: screen }) => screen)).toEqual([
      { category: "OS update required", ...funnelProps },
    ]);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        "onboarding type": "unseeded device",
        button: "Install Ledger OS update",
      }),
    );
  });
});

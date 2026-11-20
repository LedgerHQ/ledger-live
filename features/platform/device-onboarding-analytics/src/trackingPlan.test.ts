import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import {
  seededButtons,
  seededPages,
  trackSeededAborted,
  trackSeededClick,
  trackSeededDone,
  trackSeededPage,
  trackSeededStarted,
  type SeededResult,
} from "./seededTracking";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Previous page"),
}));

const result: SeededResult = {
  deviceType: DeviceModelId.STAX,
  ledgerSyncEligible: true,
  firmwareUpdateAvailability: "no",
  firmwareUpdateStarted: false,
  firmwareUpdateDone: false,
};

/** One line per event: its name, then its property names. A change here is a tracking plan change. */
function sentPlan(): string[] {
  const pages = jest
    .mocked(trackPage)
    .mock.calls.map(([page]) => `Page ${page.category} | ${keys(page.props)}`);
  const events = jest.mocked(track).mock.calls.map(([event, props]) => {
    const button = props && "button" in props ? ` "${String(props.button)}"` : "";
    return `${event}${button} | ${keys(props)}`;
  });
  return [...pages, ...events];
}

function keys(props: object | null | undefined): string {
  return Object.keys(props ?? {})
    .sort()
    .join(", ");
}

describe("seeded tracking plan", () => {
  it("should keep the page names of the spec", () => {
    expect(Object.values(seededPages)).toEqual([
      "Genuine Check",
      "Genuine Check started",
      "Genuine Check refused on device",
      "Genuine Check error",
      "Genuine Check success",
      "Check OS version",
      "OS update required",
      "OS update required refusal screen",
      "Drawer : OS update unsupported",
      "Genuine Check & OS success",
      "Ledger Sync",
      "Ledger Sync Refused",
      "Ledger Sync Success",
    ]);
  });

  it("should keep the button names of the spec", () => {
    expect(Object.values(seededButtons)).toEqual([
      "Initiate Genuine Check",
      "Retry genuine check",
      "Continue",
      "Install Ledger OS update",
      "Skip Ledger OS update",
      "Activate sync",
      "Skip",
      "Learn more",
      "Enable sync",
      "Yes, skip",
      "close",
    ]);
  });

  it("should keep the properties of each event", () => {
    trackSeededPage(seededPages.genuineCheck, DeviceModelId.STAX);
    trackSeededClick(seededButtons.continue, DeviceModelId.STAX);
    trackSeededStarted(result);
    trackSeededDone(result);
    trackSeededAborted(result);

    const seeded = "deviceType, onboarding type, seedConfiguration, sourceFlow";
    const end = `deviceType, firmware_update_availability, firmware_update_done, firmware_update_started, ledger_sync_done, onboarding type, seedConfiguration, source, sourceFlow`;
    expect(sentPlan()).toEqual([
      `Page Genuine Check | ${seeded}`,
      `button_clicked "Continue" | button, deviceType, onboarding type, seedConfiguration, source, sourceFlow`,
      `onboarding_started | deviceType, ledger_sync_eligibility, onboarding type, seedConfiguration, source, sourceFlow`,
      `onboarding_done | ${end}`,
      `onboarding_aborted | ${end}`,
    ]);
  });
});

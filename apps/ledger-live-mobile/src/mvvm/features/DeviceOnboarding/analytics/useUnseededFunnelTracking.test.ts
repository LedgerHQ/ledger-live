import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  RecoveryKeyStatus,
  SeedPath,
  type DeviceOnboardingContext,
} from "@features/platform-device-onboarding";
import { track, trackPage } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { useUnseededFunnelTracking } from "./useUnseededFunnelTracking";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Previous page"),
}));

type Step = Readonly<{ state: string; context?: Partial<DeviceOnboardingContext> }>;

function context(overrides: Partial<DeviceOnboardingContext> = {}): DeviceOnboardingContext {
  return {
    onboardedOnEntry: false,
    deviceModelId: DeviceModelId.STAX,
    offerSync: true,
    firmware: null,
    seedPath: null,
    checksPaused: false,
    lastGenuineFailure: null,
    lastDeviceState: null,
    ...overrides,
  } as DeviceOnboardingContext;
}

/** Walks the hook through the machine states, and returns what it sent, in order. */
function walk(steps: readonly Step[]): string[] {
  const sent: string[] = [];
  jest.mocked(trackPage).mockImplementation(({ category }) => {
    sent.push(`Page ${category}`);
  });
  jest.mocked(track).mockImplementation(async event => {
    sent.push(event);
  });
  let step = steps[0];
  const { rerender } = renderHook(() =>
    useUnseededFunnelTracking({ machineState: step.state, machineContext: context(step.context) }),
  );
  for (step of steps.slice(1)) rerender(undefined as never);
  return sent;
}

const upToDate = { firmware: { kind: "upToDate" } } as const;
const newSeed = { ...upToDate, seedPath: SeedPath.NewSeed };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useUnseededFunnelTracking", () => {
  it("should send the new seed funnel of the tracking plan, step by step", () => {
    const sent = walk([
      { state: "readingState" },
      { state: "awaitingStart" },
      { state: "checks.genuineCheck.running" },
      { state: "checks.firmwareCheck.running" },
      { state: "checks.checksSucceeded", context: upToDate },
      { state: "deviceSetup.naming", context: upToDate },
      { state: "deviceLocked", context: upToDate },
      { state: "deviceSetup.naming", context: upToDate },
      { state: "deviceSetup.pin", context: upToDate },
      { state: "deviceSetup.setupChoice", context: upToDate },
      { state: "deviceSetup.newSeed", context: newSeed },
      { state: "deviceSetup.backupRecoveryKey", context: newSeed },
      {
        state: "done",
        context: {
          ...newSeed,
          lastDeviceState: { isOnboarded: true, recoveryKeyStatus: RecoveryKeyStatus.Ready },
        } as Partial<DeviceOnboardingContext>,
      },
    ]);

    expect(sent).toEqual([
      "onboarding_started",
      "Page Genuine Check started",
      "Page Check OS version",
      "Page Genuine Check & OS success",
      "Page Device Name",
      "Page Pin setup",
      "Page Choice of setup",
      "Page Secret Recovery Phrase - Start",
      "Page Secret Recovery Phrase - Success",
      "Page Ledger Recovery key setup - Start",
      "Page Ledger Recovery key - Success",
      "onboarding_device_setup_finished",
    ]);
  });

  it("should close a restore with its success page and the restore seed configuration", () => {
    const restore = { ...upToDate, seedPath: SeedPath.RestorePhrase };
    walk([
      { state: "deviceSetup.restoreChoice", context: upToDate },
      { state: "deviceSetup.restoreWords", context: restore },
      {
        state: "done",
        context: {
          ...restore,
          lastDeviceState: { isOnboarded: true },
        } as Partial<DeviceOnboardingContext>,
      },
    ]);

    expect(jest.mocked(trackPage).mock.calls.map(([page]) => page.category)).toEqual([
      "Restore - choice of setup",
      "Restore - Secret Recovery Phrase - Start",
      "Restore - Secret Recovery Phrase - Success",
    ]);
    expect(track).toHaveBeenLastCalledWith(
      "onboarding_device_setup_finished",
      expect.objectContaining({
        "onboarding type": "unseeded device",
        seedConfiguration: "restore_seed",
        deviceModelId: "stax",
      }),
    );
  });

  it("should not start the funnel of a device that leaves for the legacy flow", () => {
    walk([{ state: "readingState" }, { state: "routing" }, { state: "legacyFallback" }]);

    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should keep an offered update in the finished setup after the update resets the check", () => {
    const offered = { firmware: { kind: "offered" } } as Partial<DeviceOnboardingContext>;
    walk([
      { state: "awaitingStart" },
      { state: "checks.firmwareUpdateOffered", context: offered },
      { state: "awaitingSessionAfterFirmwareUpdate" },
      { state: "checks.firmwareCheck.running" },
      { state: "deviceSetup.pin", context: upToDate },
      {
        state: "done",
        context: {
          ...newSeed,
          lastDeviceState: { isOnboarded: true },
        } as Partial<DeviceOnboardingContext>,
      },
    ]);

    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({ firmware_update_availability: "unknown" }),
    );
    expect(track).toHaveBeenLastCalledWith(
      "onboarding_device_setup_finished",
      expect.objectContaining({ firmware_update_availability: "yes" }),
    );
  });

  it("should finish the setup without a seed configuration when the device skipped every path step", () => {
    walk([
      { state: "deviceSetup.waiting", context: upToDate },
      {
        state: "done",
        context: {
          ...upToDate,
          lastDeviceState: { isOnboarded: true },
        } as Partial<DeviceOnboardingContext>,
      },
    ]);

    expect(track).toHaveBeenLastCalledWith(
      "onboarding_device_setup_finished",
      expect.not.objectContaining({ seedConfiguration: expect.anything() }),
    );
  });

  it("should close the new seed before the Recovery Key starts, even after a lock", () => {
    walk([
      { state: "deviceSetup.newSeed", context: newSeed },
      { state: "deviceLocked", context: newSeed },
      { state: "deviceSetup.backupRecoveryKey", context: newSeed },
    ]);

    expect(jest.mocked(trackPage).mock.calls.map(([page]) => page.category)).toEqual([
      "Secret Recovery Phrase - Start",
      "Secret Recovery Phrase - Success",
      "Ledger Recovery key setup - Start",
    ]);
  });

  it("should forget the Recovery Key of an attempt the device restarted", () => {
    const step = { currentSetupStep: "new-device" } as Partial<DeviceOnboardingContext>;
    const forgotten = {
      ...upToDate,
      seedPath: null,
      currentSetupStep: null,
    } as Partial<DeviceOnboardingContext>;
    walk([
      { state: "deviceSetup.newSeed", context: { ...newSeed, ...step } },
      { state: "deviceSetup.backupRecoveryKey", context: { ...newSeed, ...step } },
      { state: "routing", context: forgotten },
      { state: "deviceSetup.newSeed", context: { ...newSeed, ...step } },
      {
        state: "done",
        context: {
          ...newSeed,
          ...step,
          lastDeviceState: { isOnboarded: true, recoveryKeyStatus: null },
        } as Partial<DeviceOnboardingContext>,
      },
    ]);

    const pages = jest.mocked(trackPage).mock.calls.map(([page]) => page.category);
    expect(pages.slice(-2)).toEqual([
      "Secret Recovery Phrase - Start",
      "Secret Recovery Phrase - Success",
    ]);
    expect(pages).not.toContain("Ledger Recovery key - Rejected");
  });

  it("should show the OS check of the update an unseeded Nano held back until setup", () => {
    walk([
      { state: "deviceSetup.pin", context: upToDate },
      { state: "postSetupFirmware.firmwareCheck", context: upToDate },
    ]);

    expect(jest.mocked(trackPage).mock.calls.map(([page]) => page.category)).toEqual([
      "Pin setup",
      "Check OS version",
    ]);
  });

  it("should not finish the setup when a reconnect runs the checks during the Recovery Key backup", () => {
    const seeded = { ...newSeed, lastDeviceState: { isOnboarded: true, recoveryKeyStatus: null } };
    walk([
      { state: "deviceSetup.backupRecoveryKey", context: newSeed },
      { state: "checks.genuineCheck.running", context: seeded } as Step,
      { state: "deviceSetup.backupRecoveryKey", context: seeded } as Step,
      {
        state: "done",
        context: {
          ...newSeed,
          lastDeviceState: { isOnboarded: true, recoveryKeyStatus: RecoveryKeyStatus.Ready },
        },
      } as Step,
    ]);

    const finished = jest
      .mocked(track)
      .mock.calls.filter(([event]) => event === "onboarding_device_setup_finished");
    expect(finished).toHaveLength(1);
    expect(jest.mocked(trackPage).mock.calls.map(([page]) => page.category)).toContain(
      "Ledger Recovery key - Success",
    );
  });

  it("should leave the Recovery Key result out when the device reports no final status", () => {
    walk([
      { state: "deviceSetup.backupRecoveryKey", context: newSeed },
      {
        state: "done",
        context: {
          ...newSeed,
          lastDeviceState: { isOnboarded: true, recoveryKeyStatus: RecoveryKeyStatus.None },
        },
      } as Step,
    ]);

    const pages = jest.mocked(trackPage).mock.calls.map(([page]) => page.category);
    expect(pages).not.toContain("Ledger Recovery key - Rejected");
    expect(pages).not.toContain("Ledger Recovery key - Success");
  });

  it("should send nothing for a device seeded on entry", () => {
    walk([
      { state: "checks.genuineCheck.running", context: { onboardedOnEntry: true } },
      { state: "checks.checksSucceeded", context: { onboardedOnEntry: true, ...upToDate } },
    ]);

    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });
});

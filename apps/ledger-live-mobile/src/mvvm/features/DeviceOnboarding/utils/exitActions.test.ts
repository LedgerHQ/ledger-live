import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { StackActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import type { SeededResult } from "@features/platform-device-onboarding-analytics";
import { exitActions, exitOutcome } from "./exitActions";

const seededResult: SeededResult = {
  deviceType: DmkDeviceModelId.STAX,
  ledgerSyncEligible: false,
  firmwareUpdateAvailability: "no",
  firmwareUpdateStarted: false,
  firmwareUpdateDone: false,
};

type ExitDeps = Parameters<(typeof exitActions)[DeviceOnboardingExitReason]>[0];
type Route = { name: string; params?: unknown; state?: { routes: Route[] } };

const stax: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const nanoS: Device = {
  deviceId: "nano-s-id",
  deviceName: "Nano S",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const portfolio = [NavigatorName.Base, NavigatorName.Main];

describe("exitActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      "resumeFirmwareUpdate",
      [NavigatorName.Base, NavigatorName.MyWallet, ScreenName.MyWallet],
      { device: stax, firmwareUpdate: false },
    ],
  ] as const)("%s opens %j", (reason, path, params) => {
    const { opened } = leave(reason);

    expect(opened).toEqual({ path, params });
  });

  it("should complete and open the portfolio when the device is already synced", () => {
    const { opened, dispatched, navigated } = leave("completed", { wasReadOnlyAtEntry: true });

    expect(opened?.path).toEqual(portfolio);
    expect(navigated).toBeNull();
    expect(dispatched).toEqual([
      setIsReborn(false),
      setOnboardingHasDevice(true),
      completeOnboarding(),
      setReadOnlyMode(false),
      setHasBeenUpsoldProtect(false),
      setHasBeenRedirectedToPostOnboarding(false),
    ]);
  });

  it("should go back to the screen that opened onboarding", () => {
    const { opened, popped } = leave("completed", { outcome: "done" }, [
      NavigatorName.Base,
      NavigatorName.BaseOnboarding,
    ]);

    expect(opened).toBeNull();
    expect(popped).toEqual(StackActions.pop(1));
  });

  it("should close the device flow and onboarding together", () => {
    const { opened, popped } = leave("completed", { outcome: "done" }, [
      NavigatorName.Base,
      NavigatorName.BaseOnboarding,
      NavigatorName.DeviceOnboarding,
    ]);

    expect(opened).toBeNull();
    expect(popped).toEqual(StackActions.pop(2));
  });

  it("should leave the post-onboarding redirect untouched when the user was not read-only", () => {
    const { dispatched } = leave("completed", {
      wasReadOnlyAtEntry: false,
      hasCompletedOnboarding: true,
    });

    expect(dispatched).toEqual([
      setIsReborn(false),
      completeOnboarding(),
      setReadOnlyMode(false),
      setHasBeenUpsoldProtect(false),
    ]);
  });

  it("should open the sync offer instead of Ledger Sync", () => {
    const { opened, dispatched, navigated } = leave("offerLedgerSync", {
      wasReadOnlyAtEntry: true,
    });

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
    expect(navigated).toEqual({
      name: ScreenName.DeviceOnboardingSyncOffer,
      params: {
        device: stax,
        wasReadOnlyAtEntry: true,
        seededResult,
      },
    });
  });

  it("opens the update at once for a wired device", () => {
    const wired = { ...stax, wired: true };

    expect(leave("resumeFirmwareUpdate", { device: wired }).opened?.params).toEqual({
      device: wired,
      firmwareUpdate: true,
    });
  });

  it("should leave without completing when the device is not genuine", () => {
    const { opened, dispatched, wentBack } = leave("userQuit", { outcome: "aborted" });

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
    expect(wentBack).toBe(true);
  });

  it("should complete and open the portfolio when a genuine device quits", () => {
    const { opened, dispatched, wentBack } = leave("userQuit", {
      outcome: "done",
      wasReadOnlyAtEntry: true,
    });

    expect(wentBack).toBe(false);
    expect(opened?.path).toEqual(portfolio);
    expect(dispatched).toEqual([
      setIsReborn(false),
      setOnboardingHasDevice(true),
      completeOnboarding(),
      setReadOnlyMode(false),
      setHasBeenUpsoldProtect(false),
      setHasBeenRedirectedToPostOnboarding(false),
    ]);
  });

  it("should leave without completing when a seeded read fails after a supported firmware", () => {
    const { opened, dispatched, wentBack } = leave("legacyFallback", {
      deviceWasSeeded: true,
      outcome: "aborted",
    });

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
    expect(wentBack).toBe(true);
  });

  it("should open the old checks above onboarding when seeded firmware cannot be verified here", () => {
    const { dispatched, wentBack, reset } = leave("legacyFallback", {
      deviceWasSeeded: true,
      outcome: "legacy",
    });

    expect(wentBack).toBe(false);
    expect(dispatched).toEqual([]);
    expect(reset).toEqual({
      index: 0,
      routes: [
        {
          name: NavigatorName.BaseOnboarding,
          state: {
            index: 1,
            routes: [
              { name: NavigatorName.Onboarding },
              {
                name: NavigatorName.SyncOnboarding,
                state: {
                  routes: [
                    {
                      name: ScreenName.SyncOnboardingCompanion,
                      params: { device: stax },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it.each([
    ["completed", {}, "done"],
    ["offerLedgerSync", {}, "syncOffer"],
    ["resumeFirmwareUpdate", {}, "aborted"],
    ["userQuit", { genuine: true }, "done"],
    ["userQuit", { genuine: false }, "aborted"],
    ["legacyFallback", { seeded: false }, "legacy"],
    ["legacyFallback", { genuine: true }, "done"],
    ["legacyFallback", { genuine: false }, "aborted"],
    ["legacyFallback", { genuine: false, firmwareVersion: null }, "legacy"],
    [
      "legacyFallback",
      { genuine: true, onboardedOnEntry: true, connectSeededDevice: false },
      "legacy",
    ],
  ] as const)("should end the funnel on %s %o as %s", (reason, overrides, outcome) => {
    expect(exitOutcome(reason, exitContext(overrides))).toBe(outcome);
  });

  it("should open the legacy setup when an unseeded device falls back", () => {
    const { rootNavigated, wentBack, dispatched } = leave("legacyFallback", { outcome: "legacy" });

    expect(wentBack).toBe(false);
    expect(dispatched).toEqual([]);
    expect(rootNavigated).toBe(NavigatorName.BaseOnboarding);
  });

  it("should open the nano pairing step when a seeded nano s cannot be checked here", () => {
    const { wentBack, reset } = leave("legacyFallback", {
      device: nanoS,
      deviceWasSeeded: true,
      outcome: "legacy",
    });

    expect(wentBack).toBe(false);
    expect(reset).toEqual({
      index: 0,
      routes: [
        {
          name: NavigatorName.BaseOnboarding,
          state: {
            index: 0,
            routes: [
              {
                name: NavigatorName.Onboarding,
                state: {
                  index: 1,
                  routes: [
                    { name: ScreenName.OnboardingWelcome },
                    {
                      name: ScreenName.OnboardingPairNew,
                      params: {
                        deviceModelId: DeviceModelId.nanoS,
                        fromAccessExistingWallet: true,
                        resetPostOnboardingRedirect: false,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it("should ask the nano pairing step to bring a read-only user to post-onboarding", () => {
    const { opened } = leave("legacyFallback", {
      device: nanoS,
      deviceWasSeeded: true,
      outcome: "legacy",
      wasReadOnlyAtEntry: true,
    });

    expect(opened?.params).toEqual({
      deviceModelId: DeviceModelId.nanoS,
      fromAccessExistingWallet: true,
      resetPostOnboardingRedirect: true,
    });
  });

  it("should finish a seeded fallback only after a current genuine verdict", () => {
    const { opened, dispatched, wentBack } = leave("legacyFallback", {
      deviceWasSeeded: true,
      outcome: "done",
    });

    expect(wentBack).toBe(false);
    expect(opened?.path).toEqual(portfolio);
    expect(dispatched).toEqual([
      setIsReborn(false),
      setOnboardingHasDevice(true),
      completeOnboarding(),
      setReadOnlyMode(false),
      setHasBeenUpsoldProtect(false),
    ]);
  });
});

function leave(
  reason: DeviceOnboardingExitReason,
  overrides: Partial<ExitDeps> = {},
  rootRoutes: string[] = [NavigatorName.BaseOnboarding, NavigatorName.DeviceOnboarding],
) {
  const dispatch = jest.fn();
  const outer = {
    getState: () => ({ routes: rootRoutes.map(name => ({ name })) }),
    dispatch: jest.fn(),
    reset: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => undefined,
  };
  const flow = {
    getState: () => ({ routes: [{ name: ScreenName.DeviceOnboardingFunnel }] }),
    reset: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => outer,
  };

  exitActions[reason]({
    dispatch: dispatch as unknown as ExitDeps["dispatch"],
    navigation: flow as unknown as ExitDeps["navigation"],
    device: stax,
    wasReadOnlyAtEntry: false,
    deviceWasSeeded: false,
    outcome: "done",
    seededResult,
    hasCompletedOnboarding: false,
    ...overrides,
  });

  const reset = outer.reset.mock.calls[0]?.[0] as { index: number; routes: Route[] } | undefined;

  return {
    dispatched: dispatch.mock.calls.map(([action]) => action),
    reset: reset ?? null,
    opened: reset ? lastRoute(reset.routes) : null,
    navigated: (flow.navigate.mock.calls[0]?.[0]
      ? { name: flow.navigate.mock.calls[0][0], params: flow.navigate.mock.calls[0][1] }
      : null) as { name: string; params: unknown } | null,
    wentBack: flow.goBack.mock.calls.length > 0,
    popped: outer.dispatch.mock.calls[0]?.[0] ?? null,
    rootNavigated: outer.navigate.mock.calls[0]?.[0] ?? null,
  };
}

function lastRoute(routes: Route[], path: string[] = []): { path: string[]; params: unknown } {
  const route = routes[routes.length - 1];
  const next = [...path, route.name];
  return route.state ? lastRoute(route.state.routes, next) : { path: next, params: route.params };
}

function exitContext({
  genuine = false,
  seeded = true,
  firmwareVersion = "2.4.0",
  onboardedOnEntry,
  connectSeededDevice,
}: {
  genuine?: boolean;
  seeded?: boolean;
  firmwareVersion?: string | null;
  onboardedOnEntry?: boolean;
  connectSeededDevice?: boolean;
}): DeviceOnboardingContext {
  return {
    sessionId: "session-1",
    isOnboarded: seeded,
    firmwareVersion,
    deviceModelId: DmkDeviceModelId.STAX,
    genuineVerdict: { sessionId: "session-1", isGenuine: genuine },
    onboardedOnEntry,
    connectSeededDevice,
  } as DeviceOnboardingContext;
}

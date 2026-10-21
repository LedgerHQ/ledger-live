import type { DeviceOnboardingExitReason } from "@features/platform-device-onboarding";
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
import { NavigatorName, ScreenName } from "~/const";
import { exitActions } from "./exitActions";

type ExitDeps = Parameters<(typeof exitActions)[DeviceOnboardingExitReason]>[0];
type Route = { name: string; params?: unknown; state?: { routes: Route[] } };

const stax: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const portfolio = [NavigatorName.Base, NavigatorName.Main];

describe("exitActions", () => {
  it.each([
    [
      "resumeFirmwareUpdate",
      [NavigatorName.Base, NavigatorName.MyLedger, ScreenName.MyLedgerChooseDevice],
      { device: stax, firmwareUpdate: false },
    ],
    [
      "legacyFallback",
      [NavigatorName.BaseOnboarding, NavigatorName.Onboarding, ScreenName.OnboardingUseCase],
      { deviceModelId: DeviceModelId.stax },
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

  it("opens My Wallet when it replaces My Ledger", () => {
    const { opened } = leave("resumeFirmwareUpdate", { shouldDisplayMyWallet: true });

    expect(opened?.path).toEqual([NavigatorName.Base, NavigatorName.MyWallet, ScreenName.MyWallet]);
  });

  it("should leave without completing when the device is not genuine", () => {
    const { opened, dispatched, wentBack } = leave("userQuit", { isGenuine: false });

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
    expect(wentBack).toBe(true);
  });

  it("should complete and open the portfolio when a genuine device quits", () => {
    const { opened, dispatched, wentBack } = leave("userQuit", {
      isGenuine: true,
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
      firmwareNeedsLegacyFlow: false,
    });

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
    expect(wentBack).toBe(true);
  });

  it("should open the old checks above onboarding when seeded firmware cannot be verified here", () => {
    const { dispatched, wentBack, reset } = leave("legacyFallback", {
      deviceWasSeeded: true,
      firmwareNeedsLegacyFlow: true,
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

  it("should finish a seeded fallback only after a current genuine verdict", () => {
    const { opened, dispatched, wentBack } = leave("legacyFallback", {
      deviceWasSeeded: true,
      isGenuine: true,
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

function leave(reason: DeviceOnboardingExitReason, overrides: Partial<ExitDeps> = {}) {
  const dispatch = jest.fn();
  const outer = {
    reset: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => undefined,
  };
  const inner = {
    reset: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => outer,
  };

  exitActions[reason]({
    dispatch: dispatch as unknown as ExitDeps["dispatch"],
    navigation: inner as unknown as ExitDeps["navigation"],
    device: stax,
    shouldDisplayMyWallet: false,
    wasReadOnlyAtEntry: false,
    isGenuine: false,
    deviceWasSeeded: false,
    firmwareNeedsLegacyFlow: false,
    hasCompletedOnboarding: false,
    ...overrides,
  });

  expect(inner.reset).not.toHaveBeenCalled();
  const reset = outer.reset.mock.calls[0]?.[0] as { index: number; routes: Route[] } | undefined;

  return {
    dispatched: dispatch.mock.calls.map(([action]) => action),
    reset: reset ?? null,
    opened: reset ? lastRoute(reset.routes) : null,
    navigated: (inner.navigate.mock.calls[0]?.[0]
      ? { name: inner.navigate.mock.calls[0][0], params: inner.navigate.mock.calls[0][1] }
      : null) as { name: string; params: unknown } | null,
    wentBack: inner.goBack.mock.calls.length > 0,
  };
}

function lastRoute(routes: Route[], path: string[] = []): { path: string[]; params: unknown } {
  const route = routes[routes.length - 1];
  const next = [...path, route.name];
  return route.state ? lastRoute(route.state.routes, next) : { path: next, params: route.params };
}

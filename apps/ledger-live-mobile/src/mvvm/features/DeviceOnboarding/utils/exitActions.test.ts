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
import { StackActions } from "@react-navigation/native";
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
      [NavigatorName.Base, NavigatorName.MyWallet, ScreenName.MyWallet],
      { device: stax, firmwareUpdate: false },
    ],
  ] as const)("%s opens %j", (reason, path, params) => {
    const { opened } = leave(reason);

    expect(opened).toEqual({ path, params });
  });

  it("should open the old checks above the previous screen when an unseeded touchscreen falls back", () => {
    const { reset, onboardingReset, baseOnboardingReset } = leave("legacyFallback", {}, undefined, [
      ScreenName.OnboardingWelcome,
      ScreenName.OnboardingPostWelcomeSelection,
      ScreenName.OnboardingWelcomeBack,
      ScreenName.OnboardingPairNew,
    ]);

    expect(reset).toBeNull();
    expect(onboardingReset).toBeNull();
    expect(baseOnboardingReset).toEqual({
      index: 1,
      routes: [
        {
          name: NavigatorName.Onboarding,
          state: {
            index: 2,
            routes: [
              { name: ScreenName.OnboardingWelcome },
              { name: ScreenName.OnboardingPostWelcomeSelection },
              { name: ScreenName.OnboardingWelcomeBack },
            ],
          },
        },
        {
          name: NavigatorName.SyncOnboarding,
          state: {
            routes: [
              {
                name: ScreenName.SyncOnboardingCompanion,
                params: { device: stax, backReturnsToPrevious: true },
              },
            ],
          },
        },
      ],
    });
  });

  it("should open the use case above the previous screen when an unseeded Nano falls back", () => {
    const nanoX: Device = { ...stax, modelId: DeviceModelId.nanoX };
    const { reset, onboardingReset, baseOnboardingReset } = leave(
      "legacyFallback",
      { device: nanoX },
      undefined,
      [ScreenName.OnboardingWelcomeBack, ScreenName.OnboardingPairNew],
    );

    expect(reset).toBeNull();
    expect(baseOnboardingReset).toBeNull();
    expect(onboardingReset).toEqual({
      index: 1,
      routes: [
        { name: ScreenName.OnboardingWelcomeBack },
        { name: ScreenName.OnboardingUseCase, params: { deviceModelId: DeviceModelId.nanoX } },
      ],
    });
  });

  it("should keep the previous screen params when an unseeded touchscreen falls back", () => {
    const { parentReset } = fallBackFrom([
      {
        name: ScreenName.OnboardingPostWelcomeSelection,
        params: { userHasDevice: true },
      },
      { name: ScreenName.OnboardingPairNew },
    ]);

    expect(parentReset?.mock.calls[0][0].routes[0].state.routes[0]).toEqual({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: { userHasDevice: true },
    });
  });

  it("should open the old checks without an onboarding history when pairing was the only screen", () => {
    const { parentReset } = fallBackFrom([{ name: ScreenName.OnboardingPairNew }]);

    expect(parentReset?.mock.calls[0][0].routes[0]).toEqual({ name: NavigatorName.Onboarding });
  });

  it("should leave the stack untouched when the onboarding navigator has no parent", () => {
    const { onboardingReset, parentReset } = fallBackFrom(
      [{ name: ScreenName.OnboardingPairNew }],
      false,
    );

    expect(onboardingReset).not.toHaveBeenCalled();
    expect(parentReset).toBeNull();
  });

  it("should drop the funnel from the stack when an unseeded device falls back from it", () => {
    const { baseOnboardingReset } = leave("legacyFallback", {}, undefined, [
      ScreenName.OnboardingWelcomeBack,
      ScreenName.DeviceOnboardingFunnel,
    ]);

    expect(baseOnboardingReset?.routes[0]).toEqual({
      name: NavigatorName.Onboarding,
      state: { index: 0, routes: [{ name: ScreenName.OnboardingWelcomeBack }] },
    });
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
    const { opened, popped } = leave("completed", { isGenuine: true }, [
      NavigatorName.Base,
      NavigatorName.BaseOnboarding,
    ]);

    expect(opened).toBeNull();
    expect(popped).toEqual(StackActions.pop(1));
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

function fallBackFrom(routes: { name: string; params?: unknown }[], withParent = true) {
  const parentReset = jest.fn();
  const onboardingReset = jest.fn();
  exitActions.legacyFallback({
    dispatch: jest.fn() as unknown as ExitDeps["dispatch"],
    navigation: {
      getState: () => ({ routes }),
      reset: onboardingReset,
      getParent: () => (withParent ? { reset: parentReset } : undefined),
    } as unknown as ExitDeps["navigation"],
    device: stax,
    wasReadOnlyAtEntry: false,
    isGenuine: false,
    deviceWasSeeded: false,
    firmwareNeedsLegacyFlow: false,
    hasCompletedOnboarding: false,
  });

  return { onboardingReset, parentReset: withParent ? parentReset : null };
}

function leave(
  reason: DeviceOnboardingExitReason,
  overrides: Partial<ExitDeps> = {},
  rootRoutes: string[] = [NavigatorName.BaseOnboarding],
  onboardingRoutes: string[] = [ScreenName.OnboardingPairNew],
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
  const baseOnboarding = {
    reset: jest.fn(),
    getParent: () => outer,
  };
  const inner = {
    getState: () => ({ routes: onboardingRoutes.map(name => ({ name })) }),
    reset: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => baseOnboarding,
  };

  exitActions[reason]({
    dispatch: dispatch as unknown as ExitDeps["dispatch"],
    navigation: inner as unknown as ExitDeps["navigation"],
    device: stax,
    wasReadOnlyAtEntry: false,
    isGenuine: false,
    deviceWasSeeded: false,
    firmwareNeedsLegacyFlow: false,
    hasCompletedOnboarding: false,
    ...overrides,
  });

  const reset = outer.reset.mock.calls[0]?.[0] as { index: number; routes: Route[] } | undefined;

  return {
    dispatched: dispatch.mock.calls.map(([action]) => action),
    reset: reset ?? null,
    baseOnboardingReset: baseOnboarding.reset.mock.calls[0]?.[0] ?? null,
    onboardingReset: inner.reset.mock.calls[0]?.[0] ?? null,
    opened: reset ? lastRoute(reset.routes) : null,
    navigated: (inner.navigate.mock.calls[0]?.[0]
      ? { name: inner.navigate.mock.calls[0][0], params: inner.navigate.mock.calls[0][1] }
      : null) as { name: string; params: unknown } | null,
    wentBack: inner.goBack.mock.calls.length > 0,
    popped: outer.dispatch.mock.calls[0]?.[0] ?? null,
  };
}

function lastRoute(routes: Route[], path: string[] = []): { path: string[]; params: unknown } {
  const route = routes[routes.length - 1];
  const next = [...path, route.name];
  return route.state ? lastRoute(route.state.routes, next) : { path: next, params: route.params };
}

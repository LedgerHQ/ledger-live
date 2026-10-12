import type { DeviceOnboardingExitReason } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  completeOnboarding,
  setFromLedgerSyncOnboarding,
  setHasOrderedNano,
  setOnboardingType,
  setReadOnlyMode,
} from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { OnboardingType } from "~/reducers/types";
import { exitActions } from "./exitActions";

type ExitDeps = Parameters<(typeof exitActions)[DeviceOnboardingExitReason]>[0];
type Route = { name: string; params?: unknown; state?: { routes: Route[] } };

const stax: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

describe("exitActions", () => {
  it.each([
    [
      "completed",
      [
        NavigatorName.BaseOnboarding,
        NavigatorName.SyncOnboarding,
        ScreenName.SyncOnboardingCompletion,
      ],
      { device: stax },
    ],
    [
      "offerLedgerSync",
      [
        NavigatorName.BaseOnboarding,
        NavigatorName.WalletSync,
        ScreenName.WalletSyncActivationProcess,
      ],
      { device: stax },
    ],
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

  it("marks the onboarding as done when it completes", () => {
    const { dispatched } = leave("completed");

    expect(dispatched).toEqual([
      setReadOnlyMode(false),
      setHasOrderedNano(false),
      completeOnboarding(),
    ]);
  });

  it("starts a new Ledger Sync setup when it offers sync", () => {
    const { dispatched } = leave("offerLedgerSync");

    expect(dispatched).toEqual([
      setFromLedgerSyncOnboarding(true),
      setOnboardingType(OnboardingType.setupNew),
    ]);
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

  it("stays on the screen when the user quits", () => {
    const { opened, dispatched } = leave("userQuit");

    expect(opened).toBeNull();
    expect(dispatched).toEqual([]);
  });
});

/** Runs the exit with a nested navigator, and reads where the outermost one was reset to. */
function leave(reason: DeviceOnboardingExitReason, overrides: Partial<ExitDeps> = {}) {
  const dispatch = jest.fn();
  const outer = { reset: jest.fn(), getParent: () => undefined };
  const inner = { reset: jest.fn(), getParent: () => outer };

  exitActions[reason]({
    dispatch: dispatch as unknown as ExitDeps["dispatch"],
    navigation: inner as unknown as ExitDeps["navigation"],
    device: stax,
    shouldDisplayMyWallet: false,
    ...overrides,
  });

  expect(inner.reset).not.toHaveBeenCalled();
  const reset = outer.reset.mock.calls[0]?.[0] as { routes: Route[] } | undefined;

  return {
    dispatched: dispatch.mock.calls.map(([action]) => action),
    opened: reset ? lastRoute(reset.routes) : null,
  };
}

/** Follows the last route at each level: the screen the user lands on, and the path to it. */
function lastRoute(routes: Route[], path: string[] = []): { path: string[]; params: unknown } {
  const route = routes[routes.length - 1];
  const next = [...path, route.name];
  return route.state ? lastRoute(route.state.routes, next) : { path: next, params: route.params };
}

import { StackActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import {
  requiresLegacyFlow,
  type DeviceOnboardingContext,
  type DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { NavigatorName, ScreenName } from "~/const";
import type { useDispatch } from "~/context/hooks";
import type { SeededResult } from "@features/platform-device-onboarding-analytics";
import { completeSeededOnboarding } from "../hooks/useCompleteSeededOnboarding";
import { isCurrentSessionGenuine } from "./genuineSession";

type ExitDeps = {
  dispatch: ReturnType<typeof useDispatch>;
  navigation: NavigationProp<ParamListBase>;
  device: Device;
  wasReadOnlyAtEntry: boolean;
  deviceWasSeeded: boolean;
  /** From `exitOutcome`: the same decision drives this navigation and the funnel end event. */
  outcome: ExitOutcome;
  seededResult: SeededResult | null;
  hasCompletedOnboarding: boolean;
};

export const exitActions: Record<DeviceOnboardingExitReason, (deps: ExitDeps) => void> = {
  completed: ({ dispatch, navigation, wasReadOnlyAtEntry, hasCompletedOnboarding }) => {
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
  offerLedgerSync: ({ navigation, device, wasReadOnlyAtEntry, seededResult }) =>
    navigation.navigate(ScreenName.DeviceOnboardingSyncOffer, {
      device,
      wasReadOnlyAtEntry,
      seededResult,
    }),
  resumeFirmwareUpdate: ({ navigation, device }) => resetToMyLedger(navigation, device),
  legacyFallback: deps => {
    if (deps.outcome !== "legacy") {
      finishOrGoBack(deps);
      return;
    }
    if (deps.deviceWasSeeded)
      resetToLegacySeededChecks(deps.navigation, deps.device, deps.wasReadOnlyAtEntry);
    else openLegacySetup(deps.navigation, deps.device);
  },
  userQuit: finishOrGoBack,
};

/** A finished funnel completes onboarding; an aborted one goes back without saving. */
function finishOrGoBack({
  outcome,
  dispatch,
  navigation,
  wasReadOnlyAtEntry,
  hasCompletedOnboarding,
}: ExitDeps) {
  if (outcome !== "done") {
    navigation.goBack();
    return;
  }
  completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
  closeOnboarding(navigation);
}

function firmwareNeedsLegacyFlow(context: DeviceOnboardingContext): boolean {
  return (
    context.isOnboarded === true &&
    (context.firmwareVersion === null ||
      requiresLegacyFlow({
        currentVersion: context.firmwareVersion,
        deviceModelId: context.deviceModelId,
        isOnboarded: true,
      }))
  );
}

/** How the funnel ends for each exit. `exitActions` and the tracking both read it. */
export type ExitOutcome = "done" | "aborted" | "syncOffer" | "legacy";

export function exitOutcome(
  reason: DeviceOnboardingExitReason,
  context: DeviceOnboardingContext,
): ExitOutcome {
  const genuine = isCurrentSessionGenuine(context);
  switch (reason) {
    case "completed":
      return "done";
    case "offerLedgerSync":
      return "syncOffer";
    case "resumeFirmwareUpdate":
      return "aborted";
    case "userQuit":
      return genuine ? "done" : "aborted";
    case "legacyFallback":
      if (context.isOnboarded !== true) return "legacy";
      // The host cannot run seeded checks: the old seeded checks take over, whatever the verdict.
      if (context.onboardedOnEntry === true && !context.connectSeededDevice) return "legacy";
      if (genuine) return "done";
      return firmwareNeedsLegacyFlow(context) ? "legacy" : "aborted";
  }
}

/** Back to the caller, or Portfolio on first launch. */
export function closeOnboarding(navigation: NavigationProp<ParamListBase>) {
  const root = getRootNavigation(navigation);
  const { routes } = root.getState();
  const index = routes.findIndex(route => route.name === NavigatorName.BaseOnboarding);
  if (index > 0) root.dispatch(StackActions.pop(routes.length - index));
  else resetToPortfolio(navigation);
}

export function resetToPortfolio(navigation: NavigationProp<ParamListBase>) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.Base,
        state: {
          routes: [{ name: NavigatorName.Main }],
        },
      },
    ],
  });
}

function getRootNavigation(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<ParamListBase> {
  let current = navigation;
  let parent = current.getParent();
  while (parent) {
    current = parent;
    parent = current.getParent();
  }
  return current;
}

function resetToMyLedger(navigation: NavigationProp<ParamListBase>, device: Device) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.Base,
        state: {
          index: 1,
          routes: [
            { name: NavigatorName.Main },
            {
              name: NavigatorName.MyWallet,
              state: {
                routes: [
                  {
                    name: ScreenName.MyWallet,
                    params: { device, firmwareUpdate: device.wired },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
}

/**
 * The old checks of a seeded device: the sync companion on a touchscreen, the pairing step on a
 * Nano. Both sit on the onboarding welcome screen, where their back button returns.
 */
function resetToLegacySeededChecks(
  navigation: NavigationProp<ParamListBase>,
  device: Device,
  wasReadOnlyAtEntry: boolean,
) {
  const onboardingRoutes = isSyncOnboardingSupported(device.modelId)
    ? [
        { name: NavigatorName.Onboarding },
        {
          name: NavigatorName.SyncOnboarding,
          state: { routes: [{ name: ScreenName.SyncOnboardingCompanion, params: { device } }] },
        },
      ]
    : [
        {
          name: NavigatorName.Onboarding,
          state: {
            index: 1,
            routes: [
              { name: ScreenName.OnboardingWelcome },
              {
                name: ScreenName.OnboardingPairNew,
                params: {
                  deviceModelId: device.modelId,
                  fromAccessExistingWallet: true,
                  resetPostOnboardingRedirect: wasReadOnlyAtEntry,
                },
              },
            ],
          },
        },
      ];

  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.BaseOnboarding,
        state: { index: onboardingRoutes.length - 1, routes: onboardingRoutes },
      },
    ],
  });
}

/** Leaves the flow for the onboarding screens below it, where the old setup lives. `pop` removes the flow instead of stacking a second onboarding. */
function openLegacySetup(navigation: NavigationProp<ParamListBase>, device: Device) {
  const root = getRootNavigation(navigation);
  if (isSyncOnboardingSupported(device.modelId)) {
    root.navigate(
      NavigatorName.BaseOnboarding,
      {
        screen: NavigatorName.SyncOnboarding,
        params: {
          screen: ScreenName.SyncOnboardingCompanion,
          params: { device, backReturnsToPrevious: true },
        },
      },
      { pop: true },
    );
    return;
  }
  root.navigate(
    NavigatorName.BaseOnboarding,
    {
      screen: NavigatorName.Onboarding,
      params: { screen: ScreenName.OnboardingUseCase, params: { deviceModelId: device.modelId } },
    },
    { pop: true },
  );
}

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
  isGenuine: boolean;
  deviceWasSeeded: boolean;
  seededResult: SeededResult | null;
  firmwareNeedsLegacyFlow: boolean;
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
  legacyFallback: ({
    navigation,
    device,
    dispatch,
    wasReadOnlyAtEntry,
    isGenuine,
    deviceWasSeeded,
    firmwareNeedsLegacyFlow,
    hasCompletedOnboarding,
  }) => {
    if (!deviceWasSeeded) {
      openLegacySetup(navigation, device);
      return;
    }
    if (!isGenuine) {
      if (firmwareNeedsLegacyFlow) {
        resetToLegacySeededChecks(navigation, device);
        return;
      }
      navigation.goBack();
      return;
    }
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
  userQuit: ({ dispatch, navigation, wasReadOnlyAtEntry, isGenuine, hasCompletedOnboarding }) => {
    if (!isGenuine) {
      navigation.goBack();
      return;
    }
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
};

export function firmwareNeedsLegacyFlow(context: DeviceOnboardingContext): boolean {
  return (
    context.isOnboarded === true &&
    (context.firmwareVersion === null ||
      requiresLegacyFlow({
        currentVersion: context.firmwareVersion,
        deviceModelId: context.deviceModelId,
      }))
  );
}

/** How a seeded funnel ends for each exit, as `exitActions` handles it. */
export type SeededOutcome = "done" | "aborted" | "syncOffer" | "legacy";

export function seededOutcome(
  reason: DeviceOnboardingExitReason,
  context: DeviceOnboardingContext,
): SeededOutcome {
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

function resetToLegacySeededChecks(navigation: NavigationProp<ParamListBase>, device: Device) {
  getRootNavigation(navigation).reset({
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
                    params: { device },
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

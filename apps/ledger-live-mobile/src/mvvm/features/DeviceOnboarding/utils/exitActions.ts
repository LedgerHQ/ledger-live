import { StackActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import {
  requiresLegacyFlow,
  type DeviceOnboardingContext,
  type DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import type { useDispatch } from "~/context/hooks";
import {
  trackSeededAborted,
  trackSeededDone,
  type SeededResult,
} from "../analytics/seededTracking";
import { completeSeededOnboarding } from "../hooks/useCompleteSeededOnboarding";
import { isCurrentSessionGenuine } from "./genuineSession";

type ExitDeps = {
  dispatch: ReturnType<typeof useDispatch>;
  navigation: NavigationProp<ParamListBase>;
  device: Device;
  wasReadOnlyAtEntry: boolean;
  isGenuine: boolean;
  deviceWasSeeded: boolean;
  /** Null when the device was not seeded on entry: only the seeded funnel is tracked. */
  seededResult: SeededResult | null;
  firmwareNeedsLegacyFlow: boolean;
  hasCompletedOnboarding: boolean;
};

export const exitActions: Record<DeviceOnboardingExitReason, (deps: ExitDeps) => void> = {
  completed: ({
    dispatch,
    navigation,
    wasReadOnlyAtEntry,
    hasCompletedOnboarding,
    seededResult,
  }) => {
    if (seededResult) trackSeededDone(seededResult);
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
  offerLedgerSync: ({ navigation, device, wasReadOnlyAtEntry, seededResult }) =>
    navigation.navigate(ScreenName.DeviceOnboardingSyncOffer, {
      device,
      wasReadOnlyAtEntry,
      seededResult,
    }),
  resumeFirmwareUpdate: ({ navigation, device, seededResult }) => {
    if (seededResult) trackSeededAborted(seededResult);
    resetToMyLedger(navigation, device);
  },
  legacyFallback: ({
    navigation,
    device,
    dispatch,
    wasReadOnlyAtEntry,
    isGenuine,
    deviceWasSeeded,
    seededResult,
    firmwareNeedsLegacyFlow,
    hasCompletedOnboarding,
  }) => {
    if (!deviceWasSeeded) {
      resetToLegacyOnboarding(navigation, device);
      return;
    }
    if (!isGenuine) {
      if (firmwareNeedsLegacyFlow) {
        resetToLegacySeededChecks(navigation, device);
        return;
      }
      if (seededResult) trackSeededAborted(seededResult);
      navigation.goBack();
      return;
    }
    if (seededResult) trackSeededDone(seededResult);
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
  userQuit: ({
    dispatch,
    navigation,
    wasReadOnlyAtEntry,
    isGenuine,
    hasCompletedOnboarding,
    seededResult,
  }) => {
    if (!isGenuine) {
      if (seededResult) trackSeededAborted(seededResult);
      navigation.goBack();
      return;
    }
    if (seededResult) trackSeededDone(seededResult);
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

/** The exits that hand the device to a legacy flow: the funnel has no result to track. */
export function isLegacyFlowExit(
  reason: DeviceOnboardingExitReason,
  context: DeviceOnboardingContext,
): boolean {
  if (reason !== "legacyFallback") return false;
  if (context.isOnboarded !== true) return true;
  return !isCurrentSessionGenuine(context) && firmwareNeedsLegacyFlow(context);
}

/** Back to the caller, or Portfolio on first launch. */
export function closeOnboarding(navigation: NavigationProp<ParamListBase>) {
  const root = getRootNavigation(navigation);
  const { routes } = root.getState();
  const index = routes.findIndex(route => route.name === NavigatorName.BaseOnboarding);
  if (index > 0) root.dispatch(StackActions.pop(routes.length - index));
  else resetToPortfolio(navigation);
}

function resetToPortfolio(navigation: NavigationProp<ParamListBase>) {
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

function resetToLegacyOnboarding(navigation: NavigationProp<ParamListBase>, device: Device) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.BaseOnboarding,
        state: {
          routes: [
            {
              name: NavigatorName.Onboarding,
              state: {
                routes: [
                  {
                    name: ScreenName.OnboardingUseCase,
                    params: { deviceModelId: device.modelId },
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

import { StackActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { DeviceOnboardingExitReason } from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import type { useDispatch } from "~/context/hooks";
import { completeSeededOnboarding } from "../hooks/useCompleteSeededOnboarding";

type ExitDeps = {
  dispatch: ReturnType<typeof useDispatch>;
  navigation: NavigationProp<ParamListBase>;
  device: Device;
  shouldDisplayMyWallet: boolean;
  wasReadOnlyAtEntry: boolean;
  isGenuine: boolean;
  deviceWasSeeded: boolean;
  firmwareNeedsLegacyFlow: boolean;
  hasCompletedOnboarding: boolean;
};

export const exitActions: Record<DeviceOnboardingExitReason, (deps: ExitDeps) => void> = {
  completed: ({ dispatch, navigation, wasReadOnlyAtEntry, hasCompletedOnboarding }) => {
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
    closeOnboarding(navigation);
  },
  offerLedgerSync: ({ navigation, device, wasReadOnlyAtEntry }) => {
    navigation.navigate(ScreenName.DeviceOnboardingSyncOffer, {
      device,
      wasReadOnlyAtEntry,
    });
  },
  resumeFirmwareUpdate: ({ navigation, device, shouldDisplayMyWallet }) =>
    resetToMyLedger(navigation, device, shouldDisplayMyWallet),
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
      resetToLegacyOnboarding(navigation, device);
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

function resetToMyLedger(
  navigation: NavigationProp<ParamListBase>,
  device: Device,
  shouldDisplayMyWallet: boolean,
) {
  const managerRoute = shouldDisplayMyWallet
    ? {
        name: NavigatorName.MyWallet,
        state: {
          routes: [
            {
              name: ScreenName.MyWallet,
              params: { device, firmwareUpdate: device.wired },
            },
          ],
        },
      }
    : {
        name: NavigatorName.MyLedger,
        state: {
          routes: [
            {
              name: ScreenName.MyLedgerChooseDevice,
              params: { device, firmwareUpdate: device.wired },
            },
          ],
        },
      };

  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.Base,
        state: {
          index: 1,
          routes: [{ name: NavigatorName.Main }, managerRoute],
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

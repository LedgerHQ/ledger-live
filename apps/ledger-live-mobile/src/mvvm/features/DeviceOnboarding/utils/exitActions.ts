import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { DeviceOnboardingExitReason } from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import type { useDispatch } from "~/context/hooks";
import { seededFunnelEntrySource } from "LLM/features/DeviceOnboarding/types";
import { completeSeededOnboarding } from "../hooks/useCompleteSeededOnboarding";

type ExitDeps = {
  dispatch: ReturnType<typeof useDispatch>;
  navigation: NavigationProp<ParamListBase>;
  device: Device;
  shouldDisplayMyWallet: boolean;
  wasReadOnlyAtEntry: boolean;
  isGenuine: boolean;
};

export const exitActions: Record<DeviceOnboardingExitReason, (deps: ExitDeps) => void> = {
  completed: ({ dispatch, navigation, wasReadOnlyAtEntry }) => {
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry);
    resetToPortfolio(navigation);
  },
  offerLedgerSync: ({ navigation, device, wasReadOnlyAtEntry }) => {
    navigation.navigate(ScreenName.DeviceOnboardingSyncOffer, {
      device,
      entrySource: seededFunnelEntrySource,
      wasReadOnlyAtEntry,
    });
  },
  resumeFirmwareUpdate: ({ navigation, device, shouldDisplayMyWallet }) =>
    resetToMyLedger(navigation, device, shouldDisplayMyWallet),
  legacyFallback: ({ navigation, device }) => resetToLegacyOnboarding(navigation, device),
  userQuit: ({ dispatch, navigation, wasReadOnlyAtEntry, isGenuine }) => {
    if (!isGenuine) {
      navigation.goBack();
      return;
    }
    completeSeededOnboarding(dispatch, wasReadOnlyAtEntry);
    resetToPortfolio(navigation);
  },
};

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

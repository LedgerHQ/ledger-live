import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { DeviceOnboardingExitReason } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  completeOnboarding,
  setFromLedgerSyncOnboarding,
  setHasOrderedNano,
  setOnboardingType,
  setReadOnlyMode,
} from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import type { useDispatch } from "~/context/hooks";
import { OnboardingType } from "~/reducers/types";

export type ExitDeps = {
  dispatch: ReturnType<typeof useDispatch>;
  navigation: NavigationProp<ParamListBase>;
  device: Device;
  shouldDisplayMyWallet: boolean;
};

/** What the app does when the machine leaves with each reason. */
export const exitActions: Record<DeviceOnboardingExitReason, (deps: ExitDeps) => void> = {
  completed: ({ dispatch, navigation, device }) => {
    dispatch(setReadOnlyMode(false));
    dispatch(setHasOrderedNano(false));
    dispatch(completeOnboarding());
    resetToSyncOnboardingCompletion(navigation, device);
  },
  offerLedgerSync: ({ dispatch, navigation, device }) => {
    dispatch(setFromLedgerSyncOnboarding(true));
    dispatch(setOnboardingType(OnboardingType.setupNew));
    resetToWalletSync(navigation, device);
  },
  resumeFirmwareUpdate: ({ navigation, device, shouldDisplayMyWallet }) =>
    resetToMyLedger(navigation, device, shouldDisplayMyWallet),
  legacyFallback: ({ navigation, device }) => resetToLegacyOnboarding(navigation, device),
  // Quit stays on the devtool, so QA can read and export the run.
  userQuit: () => undefined,
};

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

function resetToSyncOnboardingCompletion(
  navigation: NavigationProp<ParamListBase>,
  device: Device,
) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.BaseOnboarding,
        state: {
          routes: [
            {
              name: NavigatorName.SyncOnboarding,
              state: {
                routes: [
                  {
                    name: ScreenName.SyncOnboardingCompletion,
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

function resetToWalletSync(navigation: NavigationProp<ParamListBase>, device: Device) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.BaseOnboarding,
        state: {
          routes: [
            {
              name: NavigatorName.WalletSync,
              state: {
                routes: [
                  {
                    name: ScreenName.WalletSyncActivationProcess,
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

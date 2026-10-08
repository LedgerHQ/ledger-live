import { useEffect, useRef } from "react";
import {
  StackActions,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import type { DeviceOnboardingOutput } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  completeOnboarding,
  setFromLedgerSyncOnboarding,
  setHasOrderedNano,
  setOnboardingType,
  setReadOnlyMode,
} from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch, useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";

type UseDeviceOnboardingExitInput = {
  device: Device | null;
  output: DeviceOnboardingOutput | null;
};

export function useDeviceOnboardingExit({ device, output }: UseDeviceOnboardingExitInput) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const handledOutputRef = useRef<DeviceOnboardingOutput | null>(null);

  useEffect(() => {
    if (!output || !device || handledOutputRef.current === output) return;
    handledOutputRef.current = output;

    switch (output.reason) {
      case "completed":
        dispatch(setReadOnlyMode(false));
        dispatch(setHasOrderedNano(false));
        dispatch(completeOnboarding());
        resetToSyncOnboardingCompletion(navigation, device);
        break;
      case "offerLedgerSync":
        dispatch(setFromLedgerSyncOnboarding(true));
        dispatch(setOnboardingType(OnboardingType.setupNew));
        resetToWalletSync(navigation, device);
        break;
      case "resumeFirmwareUpdate":
        resetToMyLedger(navigation, device, shouldDisplayMyWallet);
        break;
      case "legacyFallback":
        resetToLegacyOnboarding(navigation, device);
        break;
      case "userQuit":
        if (hasCompletedOnboarding) {
          navigation.dispatch(StackActions.popToTop());
        } else {
          resetToDeviceSelection(navigation);
        }
        break;
    }
  }, [device, dispatch, hasCompletedOnboarding, navigation, output, shouldDisplayMyWallet]);
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

function resetToDeviceSelection(navigation: NavigationProp<ParamListBase>) {
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
                  { name: ScreenName.OnboardingWelcome },
                  { name: ScreenName.OnboardingPostWelcomeSelection },
                  { name: ScreenName.OnboardingDeviceSelection },
                ],
              },
            },
          ],
        },
      },
    ],
  });
}

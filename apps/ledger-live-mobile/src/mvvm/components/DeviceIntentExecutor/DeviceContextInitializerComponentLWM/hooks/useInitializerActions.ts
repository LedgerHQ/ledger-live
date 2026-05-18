import { useCallback } from "react";
import { Linking } from "react-native";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import type { InitializerDevice } from "../types";

export function useInitializerActions(device: InitializerDevice) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const contactSupportUrl = useLocalizedUrl(urls.contact);
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const openMyLedger = useCallback(
    (searchQuery?: string) => {
      resetToMyLedger(navigation, { searchQuery }, shouldDisplayMyWallet);
    },
    [navigation, shouldDisplayMyWallet],
  );

  const openMyLedgerFirmwareUpdate = useCallback(() => {
    resetToMyLedger(
      navigation,
      {
        device: toLiveDevice(device),
        firmwareUpdate: device.wired,
      },
      shouldDisplayMyWallet,
    );
  }, [device, navigation, shouldDisplayMyWallet]);

  const openOnboarding = useCallback(() => {
    const liveDevice = toLiveDevice(device);

    if (isSyncOnboardingSupported(device.modelId)) {
      resetToOnboarding(navigation, {
        navigator: NavigatorName.SyncOnboarding,
        screen: ScreenName.SyncOnboardingCompanion,
        params: { device: liveDevice },
      });
      return;
    }

    resetToOnboarding(navigation, {
      navigator: NavigatorName.Onboarding,
      screen: ScreenName.OnboardingUseCase,
      params: { deviceModelId: device.modelId },
    });
  }, [device, navigation]);

  const openSupport = useCallback(() => {
    Linking.openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return {
    openMyLedger,
    openMyLedgerFirmwareUpdate,
    openOnboarding,
    openSupport,
  };
}

export function toLiveDevice(device: InitializerDevice): Device {
  return {
    deviceId: device.id,
    deviceName: device.name,
    modelId: device.modelId,
    wired: device.wired,
  };
}

/**
 * Climb up to the root navigator. The initializer drawer can be opened from any
 * nested flow (send, swap, perps, …), so `useNavigation()` returns whichever
 * stack is hosting the calling screen — resetting that local stack to a route
 * named `Base` or `BaseOnboarding` would throw. We need the root navigator to
 * rewrite the whole tree.
 */
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
  params: Record<string, unknown>,
  shouldDisplayMyWallet: boolean,
) {
  const managerRoute = shouldDisplayMyWallet
    ? {
        name: NavigatorName.MyWallet,
        state: {
          routes: [{ name: ScreenName.MyWallet, params }],
        },
      }
    : {
        name: NavigatorName.MyLedger,
        state: {
          routes: [{ name: ScreenName.MyLedgerChooseDevice, params }],
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

function resetToOnboarding(
  navigation: NavigationProp<ParamListBase>,
  target: {
    navigator: NavigatorName.Onboarding | NavigatorName.SyncOnboarding;
    screen: ScreenName;
    params: Record<string, unknown>;
  },
) {
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.BaseOnboarding,
        state: {
          routes: [
            {
              name: target.navigator,
              state: {
                routes: [{ name: target.screen, params: target.params }],
              },
            },
          ],
        },
      },
    ],
  });
}

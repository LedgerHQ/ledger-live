import React, { useCallback, useEffect } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";
import BleDevicePairingFlow from "../../components/BleDevicePairingFlow";
import DeviceSetupView from "../../components/DeviceSetupView";
import { useIncrementOnNavigationFocusState } from "../../helpers/useIncrementOnNavigationFocusState";
import { usePostOnboardingURI } from "../../hooks/recoverFeatureFlag";
import { ServicesConfig } from "../../components/ServicesWidget/types";

type NavigationProps = RootComposite<
  StackNavigatorProps<
    BaseNavigatorStackParamList,
    ScreenName.RedirectToRecoverStaxFlow
  >
>;

export function RedirectToRecoverStaxFlowScreen({
  navigation,
}: NavigationProps) {
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();
  const recoverRestoreFlowURI = usePostOnboardingURI();
  const recoverConfig: ServicesConfig | null = useFeature(
    "protectServicesMobile",
  );

  useEffect(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
  }, [setFirstTimeOnboarding, setShowWelcome]);

  // Makes sure the pairing components are reset when navigating back to this screen
  const keyToReset =
    useIncrementOnNavigationFocusState<NavigationProps["navigation"]>(
      navigation,
    );

  const onPairingSuccess = useCallback(() => {
    if (recoverConfig?.enabled && recoverRestoreFlowURI) {
      Linking.canOpenURL(recoverRestoreFlowURI).then(canOpen => {
        if (canOpen) Linking.openURL(recoverRestoreFlowURI);
      });
    }
  }, [recoverConfig?.enabled, recoverRestoreFlowURI]);

  return (
    <DeviceSetupView hasBackButton>
      <Flex px={6} flex={1}>
        <BleDevicePairingFlow
          key={keyToReset}
          filterByDeviceModelId={DeviceModelId.stax}
          areKnownDevicesDisplayed={true}
          areKnownDevicesPairable={false}
          onPairingSuccess={onPairingSuccess}
          onPairingSuccessAddToKnownDevices={false}
        />
      </Flex>
    </DeviceSetupView>
  );
}

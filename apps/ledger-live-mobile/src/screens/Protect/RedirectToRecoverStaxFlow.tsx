import React, { useCallback, useEffect } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking, StyleSheet, SafeAreaView } from "react-native";
import { usePostOnboardingURI } from "@ledgerhq/live-common/hooks/recoverFeatueFlag";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { RootComposite, StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";
import BleDevicePairingFlow from "../../components/BleDevicePairingFlow";
import { useIncrementOnNavigationFocusState } from "../../helpers/useIncrementOnNavigationFocusState";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.RedirectToRecoverStaxFlow>
>;

export function RedirectToRecoverStaxFlowScreen({ navigation }: NavigationProps) {
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();
  const recoverConfig = useFeature("protectServicesMobile");
  const recoverRestoreFlowURI = usePostOnboardingURI(recoverConfig);

  useEffect(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
  }, [setFirstTimeOnboarding, setShowWelcome]);

  // Makes sure the pairing components are reset when navigating back to this screen
  const keyToReset = useIncrementOnNavigationFocusState<NavigationProps["navigation"]>(navigation);

  const onPairingSuccess = useCallback(() => {
    if (recoverConfig?.enabled && recoverRestoreFlowURI) {
      Linking.canOpenURL(recoverRestoreFlowURI).then(canOpen => {
        if (canOpen) Linking.openURL(recoverRestoreFlowURI);
      });
    }
  }, [recoverConfig?.enabled, recoverRestoreFlowURI]);

  const requestToSetHeaderOptions = useCallback(
    () => ({
      type: "clean",
    }),
    [],
  );

  return (
    <SafeAreaView style={[styles.root]}>
      <Flex px={6} flex={1}>
        <BleDevicePairingFlow
          key={keyToReset}
          filterByDeviceModelId={DeviceModelId.stax}
          areKnownDevicesDisplayed={true}
          areKnownDevicesPairable={true}
          onPairingSuccess={onPairingSuccess}
          onPairingSuccessAddToKnownDevices={true}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    alignSelf: "center",
  },
});

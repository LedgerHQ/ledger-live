import React, { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

export const SyncOnboarding = ({ navigation, route }: Props): ReactElement => {
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);

  // const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({ device, pollingPeriodMs });

  const { pairedDevice } = route.params; 

  // Triggers the pairing if no pairedDevice was given
  useEffect(() => {
    if (!pairedDevice) {
      // @ts-expect-error navigator typing issue
      navigation.navigate(ScreenName.PairDevices, {
        onlySelectDeviceWithoutFullAppPairing: true,
        onDoneNavigateTo: ScreenName.SyncOnboardingCompanion,
      });
    }
  }, [navigation, pairedDevice]);
 

  const handleOnPaired = useCallback((pairedDevice: Device) => {
    setDevice(pairedDevice);
  }, []);

  // Triggered when a new paired device is passed when navigating to this screen
  // It avoids having a callback function passed to the PairDevices screen
  useEffect(() => {
    if (pairedDevice) {
      handleOnPaired(pairedDevice);
    }
  }, [pairedDevice, handleOnPaired]);

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="100%"
      flex={1}
      bg={colors.background}
    >
      <Text>Sync Onboarding for {JSON.stringify(pairedDevice)}</Text>
    </Flex>
  );
};

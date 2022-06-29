import React from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

const pollingPeriodMs = 1000;

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { device } = route.params; 

  const { onboardingState, allowedError, fatalError } = useOnboardingStatePolling({ device, pollingPeriodMs });

  console.log(`📝 OS = ${JSON.stringify(onboardingState)} - allowedError = ${JSON.stringify(allowedError)} - fatalError = ${JSON.stringify(fatalError)}`);

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="100%"
      flex={1}
      bg={colors.background}
    >
      <Text>Sync Onboarding for {JSON.stringify(device)}</Text>
    </Flex>
  );
};

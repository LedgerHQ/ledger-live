import React, { useCallback } from "react";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationLanding
  >
>;

const steps = [
  {
    icon: "IdCard" as const,
    title: "Scan your passport",
    description: "You need to scan the code bar of your passport",
  },
  {
    icon: "WirelessCharging" as const,
    title: "Tap NFC your passport",
    description: "Tap your passport with your mobile",
  },
  {
    icon: "CheckmarkCircle" as const,
    title: "Select the proof you want to generate",
    description: "You can generate multiple proof of your identity",
  },
];

export default function LandingScreen({ navigation }: Props) {
  const handleGotIt = useCallback(() => {
    navigation.navigate(ScreenName.PassportAttestationScanMRZ);
  }, [navigation]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex flex={1} flexDirection="column" justifyContent="space-between">
        <Flex flexDirection="column" px={16} pt={16}>
          <Flex flexDirection="column" rowGap={4} mb={16}>
            <Text variant="h4" color="neutral.c100" fontWeight="semiBold">
              Generate a ZK proof of your ID
            </Text>
            <Text variant="bodyLineHeight" color="neutral.c70">
              Ledger will secure the proofs of your identity
            </Text>
          </Flex>

          <StepCard>
            {steps.map((step, index) => (
              <StepRow key={index}>
                <IconContainer>
                  <StepIcon name={step.icon} />
                </IconContainer>
                <Flex flexDirection="column" flex={1} rowGap={2}>
                  <Text variant="body" color="neutral.c100" fontWeight="semiBold">
                    {step.title}
                  </Text>
                  <Text variant="small" color="neutral.c70">
                    {step.description}
                  </Text>
                </Flex>
              </StepRow>
            ))}
          </StepCard>
        </Flex>

        <Flex px={16} pb={16}>
          <Button type="main" size="large" onPress={handleGotIt} testID="passport-landing-got-it">
            Got it
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

function StepIcon({ name }: { name: "IdCard" | "WirelessCharging" | "CheckmarkCircle" }) {
  const Icon = Icons[name];
  return <Icon size="M" color="neutral.c100" />;
}

const StepCard = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 8px;
  padding: 8px;
`;

const StepRow = styled(Flex)`
  flex-direction: row;
  align-items: center;
  padding: 12px 8px;
  gap: 12px;
`;

const IconContainer = styled(Box)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  display: flex;
  align-items: center;
  justify-content: center;
`;

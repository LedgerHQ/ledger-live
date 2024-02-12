import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track, TrackScreen } from "~/analytics";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 32px;
`;

type Props = {
  setStep: (arg: string) => void;
  onVerifyAddress: () => void;
};

const InitMessage = ({ setStep, onVerifyAddress }: Props) => {
  const onDontVerify = useCallback(() => {
    track("button_clicked", {
      button: "Reveal my address without verifying",
      drawer: "Verification Security Disclaimer",
    });
    setStep("confirmUnverified");
  }, [setStep]);

  const handleVerifyAddress = useCallback(() => {
    track("button_clicked", {
      button: "Verify my address",
      drawer: "Verification Security Disclaimer",
    });
    onVerifyAddress();
  }, [onVerifyAddress]);
  return (
    <Flex flex={1} justifyContent="center" mt={3}>
      <TrackScreen category="Deposit" name="Verification Security Disclaimer" type="drawer" />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" lineHeight="31.2px">
        <Trans i18nKey="transfer.receive.securityVerify.title" />
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c70"
        my={3}
        lineHeight="23.8px"
      >
        <Trans i18nKey="transfer.receive.securityVerify.subtitle1" />
      </Text>
      <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c70" lineHeight="23.8px">
        <Trans i18nKey="transfer.receive.securityVerify.subtitle2" />
      </Text>
      <Flex alignSelf="stretch" my={8}>
        <Button
          onPress={handleVerifyAddress}
          type="main"
          size="large"
          testID="button-verify-my-address"
        >
          <Trans i18nKey="transfer.receive.securityVerify.verifyCta" />
        </Button>
        <NotNowButton onPress={onDontVerify} testID="button-DontVerify-my-address">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="transfer.receive.securityVerify.dontVerifyCta" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default InitMessage;

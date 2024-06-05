import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import styled, { useTheme } from "styled-components";

type Props = {
  goToQRCode: () => void;
  goToSynchWithDevice: () => void;
};

export default function SynchronizeModeStep({ goToQRCode, goToSynchWithDevice }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" rowGap="16px">
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.synchronize.chooseMethod.title")}
      </Text>

      <Text fontSize={13} variant="body" color="neutral.c70">
        {t("walletSync.synchronize.chooseMethod.description")}
      </Text>

      <Card
        testId="walletSync-synchronize-connectDevice"
        title="walletSync.synchronize.chooseMethod.connectDevice.title"
        description="walletSync.synchronize.chooseMethod.connectDevice.description"
        onClick={goToSynchWithDevice}
        leftIcon={
          <IconContainer alignItems="center" justifyContent="center">
            <Icons.LedgerDevices size="M" color={colors.primary.c80} />
          </IconContainer>
        }
      />

      <Card
        testId="walletSync-synchronize-scan"
        title="walletSync.synchronize.chooseMethod.scan.title"
        description="walletSync.synchronize.chooseMethod.scan.description"
        onClick={goToQRCode}
        leftIcon={
          <IconContainer alignItems="center" justifyContent="center">
            <Icons.QrCode size="M" color={colors.primary.c80} />
          </IconContainer>
        }
      />
    </Flex>
  );
}

const IconContainer = styled(Flex)`
  border-radius: 8px;
  height: 40px;
  width: 40px;
`;

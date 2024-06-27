import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import styled, { useTheme } from "styled-components";

type Props = {
  goToQRCode: () => void;
  goToSyncWithDevice: () => void;
};

export default function SynchronizeModeStep({ goToQRCode, goToSyncWithDevice }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" rowGap="16px">
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.synchronize.chooseMethod.title")}
      </Text>

      <Card
        testId="walletSync-synchronize-connectDevice"
        title="walletSync.synchronize.chooseMethod.connectDevice.title"
        onClick={goToSyncWithDevice}
        leftIcon={
          <IconContainer alignItems="center" justifyContent="center">
            <Icons.LedgerDevices size="M" color={colors.primary.c80} />
          </IconContainer>
        }
      />

      <Card
        testId="walletSync-synchronize-scan"
        title="walletSync.synchronize.chooseMethod.scan.title"
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

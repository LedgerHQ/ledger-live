import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";
import TrackScreen from "~/analytics/TrackScreen";

type Props = {
  pinCode: string;
};

export default function PinCodeDisplay({ pinCode }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <TrackScreen category={AnalyticsPage.PinCode} />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" textAlign="center">
        {t("walletSync.synchronize.qrCode.pinCode.title")}
      </Text>

      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" px={8} mt={6}>
        {t("walletSync.synchronize.qrCode.pinCode.desc")}
      </Text>

      <Flex flexDirection="row" justifyContent="center" mt={8} columnGap={12}>
        {pinCode?.split("").map((digit, index) => (
          <NumberContainer
            key={index}
            backgroundColor={colors.opacityDefault.c05}
            alignItems="center"
            justifyContent="center"
          >
            <Text variant="body" fontWeight="medium" color="neutral.c100">
              {digit}
            </Text>
          </NumberContainer>
        ))}
      </Flex>
    </Flex>
  );
}

const NumberContainer = styled(Flex)`
  border-radius: 8px;
  height: 50px;
  width: 50px;
`;

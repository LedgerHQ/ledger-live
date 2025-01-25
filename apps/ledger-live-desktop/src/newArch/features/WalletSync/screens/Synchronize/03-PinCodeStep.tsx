import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { useSelector } from "react-redux";
import { walletSyncQrCodePinCodeSelector } from "~/renderer/reducers/walletSync";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

export default function PinCodeStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const pinCode = useSelector(walletSyncQrCodePinCodeSelector);

  return (
    <Flex flexDirection="column" rowGap="16px" justifyContent="center" flex={1}>
      <TrackPage category={AnalyticsPage.PinCode} />
      <Text
        fontSize={24}
        variant="large"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        {t("walletSync.synchronize.pinCode.title")}
      </Text>

      <Text fontSize={14} variant="body" fontWeight="500" color="neutral.c70" textAlign="center">
        {t("walletSync.synchronize.pinCode.description")}
      </Text>

      <Flex flexDirection="row" justifyContent="center" columnGap="12px" mt={"16px"}>
        {pinCode?.split("").map((digit, index) => (
          <NumberContainer
            key={index}
            backgroundColor={colors.opacityDefault.c05}
            alignItems="center"
            justifyContent="center"
            data-testid={`pin-code-digit-${index}`}
          >
            <Text fontSize={14} variant="body" fontWeight="medium" color="neutral.c100">
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

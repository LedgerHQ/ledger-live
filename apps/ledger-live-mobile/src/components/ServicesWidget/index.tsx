import { Flex, Text } from "@ledgerhq/native-ui";
import { ProtectStateNumberEnum } from "@ledgerhq/live-common/platform/providers/ProtectProvider/types";
import React, { memo, useCallback } from "react";
import { Linking, Image } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { LinearGradient, Defs, Rect, Stop } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import NewProtectState from "./Protect/NewProtectState";
import ConfirmIdentityProtectState from "./Protect/ConfirmIdentityProtectState";
import AddPaymentProtectState from "./Protect/AddPaymentProtectState";
import SubscriptionCanceledProtectState from "./Protect/SubscriptionCanceledProtectState";
import PaymentRejectedProtectState from "./Protect/PaymentRejectedProtectState";
import ActiveProtectState from "./Protect/ActiveProtectState";
import { ServicesConfig } from "./types";
import Touchable from "../Touchable";

import LedgerRecoverLogoLight from "../../images/ledger_recover_light.png";
import LedgerRecoverLogoDark from "../../images/ledger_recover_dark.png";

const SvgGradient = () => (
  <Svg width="100%" height="8px">
    <Defs>
      <LinearGradient
        id="protectGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0%" stopOpacity={1} stopColor="hsla(172, 100%, 42%, 1)" />
        <Stop
          offset="100%"
          stopOpacity={1}
          stopColor="hsla(220, 100%, 42%, 1)"
        />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#protectGradient)" />
  </Svg>
);

const statesKeys: Record<ProtectStateNumberEnum, string> = {
  [ProtectStateNumberEnum.NEW]: "new",
  [ProtectStateNumberEnum.CONFIRM_IDENTITY]: "confirmIdentity",
  [ProtectStateNumberEnum.ADD_PAYMENT]: "addPayment",
  [ProtectStateNumberEnum.PAYMENT_REJECTED]: "paymentRejected",
  [ProtectStateNumberEnum.SUBSCRIPTION_CANCELED]: "subscriptionCanceled",
  [ProtectStateNumberEnum.ACTIVE]: "active",
};

const statesComponents: Record<
  ProtectStateNumberEnum,
  React.FunctionComponent<{ params: Record<string, string> }> & {
    StatusTag: React.FunctionComponent<Record<string, never>>;
  }
> = {
  [ProtectStateNumberEnum.NEW]: NewProtectState,
  [ProtectStateNumberEnum.CONFIRM_IDENTITY]: ConfirmIdentityProtectState,
  [ProtectStateNumberEnum.ADD_PAYMENT]: AddPaymentProtectState,
  [ProtectStateNumberEnum.PAYMENT_REJECTED]: PaymentRejectedProtectState,
  [ProtectStateNumberEnum.SUBSCRIPTION_CANCELED]:
    SubscriptionCanceledProtectState,
  [ProtectStateNumberEnum.ACTIVE]: ActiveProtectState,
};

function ServicesWidget() {
  const { t } = useTranslation();
  const servicesConfig: ServicesConfig | null = useFeature(
    "protectServicesMobile",
  );
  const theme = useTheme();

  const { enabled, params } = servicesConfig || {};
  const { managerStatesData } = params || {};

  const protectStatus = ProtectStateNumberEnum.NEW;

  const ProtectStateComponent = statesComponents[protectStatus];

  const onCardPress = useCallback(() => {
    if (protectStatus !== ProtectStateNumberEnum.NEW) return;

    const { learnMoreURI } = managerStatesData?.[protectStatus] || {};
    Linking.canOpenURL(learnMoreURI).then(() => Linking.openURL(learnMoreURI));
  }, [managerStatesData, protectStatus]);

  return enabled && params?.managerStatesData ? (
    <>
      <Text mt={12} fontWeight="semiBold" variant="h5" mb={6}>
        {t("servicesWidget.title")}
      </Text>
      <Touchable onPress={onCardPress}>
        <Flex
          bg="neutral.c30"
          borderRadius={8}
          mt={5}
          mb={13}
          overflow="hidden"
        >
          <SvgGradient />
          <Flex p={8}>
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Image
                source={
                  theme.colors.type === "light"
                    ? LedgerRecoverLogoLight
                    : LedgerRecoverLogoDark
                }
                style={{ width: 90, height: 26 }}
              />
              {ProtectStateComponent && ProtectStateComponent.StatusTag ? (
                <ProtectStateComponent.StatusTag />
              ) : null}
            </Flex>
            <Text variant="paragraph" color="neutral.c80" my={7}>
              {t(
                `servicesWidget.protect.status.${statesKeys[protectStatus]}.desc`,
              )}
            </Text>
            <NewProtectState
              params={params?.managerStatesData?.[protectStatus]}
            />
          </Flex>
        </Flex>
      </Touchable>
    </>
  ) : null;
}

export default memo(ServicesWidget);

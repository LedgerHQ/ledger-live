import { Flex, Text } from "@ledgerhq/native-ui";
import { protectContext } from "@ledgerhq/live-common/platform/providers/ProtectProvider/index";
import { ProtectStateNumber } from "@ledgerhq/live-common/platform/providers/ProtectProvider/types";
import React, { memo, useContext } from "react";
import { useTranslation } from "react-i18next";
import Svg, { LinearGradient, Defs, Rect, Stop } from "react-native-svg";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import NewProtectState from "./Protect/NewProtectState";
import ActionRequiredProtectState from "./Protect/ActionRequiredProtectState";
import SubscriptionCanceledProtectState from "./Protect/SubscriptionCanceledProtectState";
import PaymentRejectedProtectState from "./Protect/PaymentRejectedProtectState";
import ActiveProtectState from "./Protect/ActiveProtectState";
import { ServicesConfig } from "./types";

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
        <Stop offset="0%" stopOpacity={1} stopColor="hsla(40, 90%, 69%, 1)" />
        <Stop offset="100%" stopOpacity={1} stopColor="hsla(40, 96%, 81%, 1)" />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#protectGradient)" />
  </Svg>
);

const statesKeys: Record<ProtectStateNumber, string> = {
  800: "new",
  900: "actionRequired",
  1000: "paymentRejected",
  1100: "subscriptionCanceled",
  1200: "active",
};

const statesComponents: Record<
  ProtectStateNumber,
  React.FunctionComponent<{ params: Record<string, string> }> & {
    StatusTag: React.FunctionComponent<Record<string, never>>;
  }
> = {
  800: NewProtectState,
  900: ActionRequiredProtectState,
  1000: PaymentRejectedProtectState,
  1100: SubscriptionCanceledProtectState,
  1200: ActiveProtectState,
};

function ServicesWidget() {
  const { t } = useTranslation();
  const servicesConfig: ServicesConfig | null = useFeature(
    "protectServicesMobile",
  );

  const { enabled, params } = servicesConfig || {};

  const {
    state: { protectState },
  } = useContext(protectContext);

  const ProtectStateComponent = statesComponents[protectState];

  return enabled && params?.managerStatesData ? (
    <>
      <Text mt={12} variant="body" fontSize="20px">
        {t("servicesWidget.title")}
      </Text>
      <Text variant="paragraph" color="neutral.c80">
        {t("servicesWidget.subTitle")}
      </Text>
      <Flex bg="neutral.c30" borderRadius={8} mt={5} mb={13} overflow="hidden">
        <SvgGradient />
        <Flex p={8}>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text variant="body" fontSize="18px" mr={6}>
              {t("servicesWidget.protect.title")}
            </Text>
            {ProtectStateComponent && ProtectStateComponent.StatusTag ? (
              <ProtectStateComponent.StatusTag />
            ) : null}
          </Flex>
          <Text variant="paragraph" color="neutral.c80" mt={3}>
            {t(
              `servicesWidget.protect.status.${statesKeys[protectState]}.desc`,
            )}
          </Text>
          <ProtectStateComponent
            params={params?.managerStatesData?.[protectState]}
          />
        </Flex>
      </Flex>
    </>
  ) : null;
}

export default memo(ServicesWidget);

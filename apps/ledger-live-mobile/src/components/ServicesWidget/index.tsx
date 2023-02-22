import { Flex, Text } from "@ledgerhq/native-ui";
import { ProtectStateNumberEnum } from "@ledgerhq/live-common/platform/providers/ProtectProvider/types";
import { refreshToken } from "@ledgerhq/live-common/platform/providers/ProtectProvider/api/index";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Svg, { LinearGradient, Defs, Rect, Stop } from "react-native-svg";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import NewProtectState from "./Protect/NewProtectState";
import ConfirmIdentityProtectState from "./Protect/ConfirmIdentityProtectState";
import AddPaymentProtectState from "./Protect/AddPaymentProtectState";
import SubscriptionCanceledProtectState from "./Protect/SubscriptionCanceledProtectState";
import PaymentRejectedProtectState from "./Protect/PaymentRejectedProtectState";
import ActiveProtectState from "./Protect/ActiveProtectState";
import { ServicesConfig } from "./types";
import { protectSelector } from "../../reducers/protect";
import { updateProtectData, updateProtectStatus } from "../../actions/protect";
import { formatData, getProtectStatus } from "../../logic/protect";
import { saveProtect } from "../../db";
import { ScreenName } from "../../const";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../RootNavigator/types/ManagerNavigator";
import Touchable from "../Touchable";

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
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const servicesConfig: ServicesConfig | null = useFeature(
    "protectServicesMobile",
  );
  const navigation =
    useNavigation<StackNavigatorNavigation<ManagerNavigatorStackParamList>>();

  const [wasPreviouslyRefreshed, setWasPreviouslyRefreshed] = useState(false);

  const { enabled, params } = servicesConfig || {};

  const { protectStatus, data } = useSelector(protectSelector);

  const ProtectStateComponent = statesComponents[protectStatus];

  const onCardPress = useCallback(() => {
    if (protectStatus !== ProtectStateNumberEnum.NEW) return;

    const { learnMoreURI } = params?.managerStatesData?.[protectStatus] || {};
    Linking.canOpenURL(learnMoreURI).then(() => Linking.openURL(learnMoreURI));
  }, [params?.managerStatesData, protectStatus]);

  useEffect(() => {
    const refreshSession = async () => {
      if (wasPreviouslyRefreshed || !data.refreshToken) {
        return;
      }

      const res = await refreshToken(data.refreshToken);

      if (!res) {
        navigation.navigate(ScreenName.ProtectLogin);
        return;
      }

      const newData = formatData(res);

      dispatch(updateProtectData(newData));
      dispatch(updateProtectStatus(getProtectStatus(newData)));
      setWasPreviouslyRefreshed(true);
    };

    refreshSession();
  }, [data.refreshToken, dispatch, navigation, wasPreviouslyRefreshed]);

  useEffect(() => {
    saveProtect({ data, protectStatus });
  }, [data, protectStatus]);

  return enabled && params?.managerStatesData ? (
    <>
      <Text mt={12} fontWeight="semiBold" variant="h5">
        {t("servicesWidget.title")}
      </Text>
      <Text variant="paragraph" color="neutral.c80">
        {t("servicesWidget.subTitle")}
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
              <Text variant="h5" mr={6}>
                {t("servicesWidget.protect.title")}
              </Text>
              {ProtectStateComponent && ProtectStateComponent.StatusTag ? (
                <ProtectStateComponent.StatusTag />
              ) : null}
            </Flex>
            <Text variant="paragraph" color="neutral.c80" mt={3}>
              {t(
                `servicesWidget.protect.status.${statesKeys[protectStatus]}.desc`,
              )}
            </Text>
            <ProtectStateComponent
              params={params?.managerStatesData?.[protectStatus]}
            />
          </Flex>
        </Flex>
      </Touchable>
    </>
  ) : null;
}

export default memo(ServicesWidget);

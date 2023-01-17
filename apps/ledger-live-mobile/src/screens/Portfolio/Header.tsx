import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  CardMedium,
  SettingsMedium,
  WarningMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import Touchable from "../../components/Touchable";
import { NavigatorName, ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import DiscreetModeButton from "../../components/DiscreetModeButton";
import { track } from "../../analytics";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import Notifications from "../../icons/Notifications";

function PortfolioHeader({ hidePortfolio }: { hidePortfolio: boolean }) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { notificationCards } = useDynamicContent();
  const { incidents } = useFilteredServiceStatus();
  const { t } = useTranslation();

  const onNotificationButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "notification bell",
      screen: ScreenName.Portfolio,
    });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation]);

  const onStatusErrorButtonPress = useCallback(() => {
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenterStatus,
    });
  }, [navigation]);
  const onSettingsButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
    });
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  const onSideImageCardButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PlatformApp, {
      platform: "cl-card",
      name: "CL Card Powered by Ledger",
    });
  }, [navigation]);

  const notificationsCount = useMemo(
    () =>
      notificationCards.length - notificationCards.filter(n => n.viewed).length,
    [notificationCards],
  );

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Flex
        flexDirection={"row"}
        alignItems={"center"}
        mr={3}
        flexShrink={1}
        flexGrow={1}
      >
        <Text
          variant={"large"}
          fontWeight={"semiBold"}
          color={"neutral.c100"}
          flexGrow={0}
          flexShrink={1}
          mr={3}
          numberOfLines={2}
        >
          {t("tabs.portfolio")}
        </Text>
        {!hidePortfolio && <DiscreetModeButton size={20} />}
        {incidents.length > 0 && (
          <Flex pl={2}>
            <Touchable onPress={onStatusErrorButtonPress}>
              <WarningMedium size={24} color={"warning.c100"} />
            </Touchable>
          </Flex>
        )}
      </Flex>
      <Flex flexDirection="row">
        <Flex mr={7}>
          <Touchable
            onPress={onSideImageCardButtonPress}
            event="button_clicked"
            eventProperties={{
              button: "card",
              screen: ScreenName.Portfolio,
            }}
          >
            <CardMedium size={24} color={"neutral.c100"} />
          </Touchable>
        </Flex>
        <Flex mr={7}>
          <Touchable onPress={onNotificationButtonPress}>
            <Notifications
              size={24}
              color={colors.neutral.c100}
              dotColor={colors.error.c80}
              isOn={notificationsCount > 0}
            />
          </Touchable>
        </Flex>
        <Touchable onPress={onSettingsButtonPress} testID="settings-icon">
          <SettingsMedium size={24} color={"neutral.c100"} />
        </Touchable>
      </Flex>
    </Flex>
  );
}

export default withDiscreetMode(PortfolioHeader);

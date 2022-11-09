import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  CardMedium,
  NotificationsMedium,
  NotificationsOnMedium,
  SettingsMedium,
  WarningMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import Touchable from "../../components/Touchable";
import { NavigatorName, ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import DiscreetModeButton from "../../components/DiscreetModeButton";
import { track } from "../../analytics";

function PortfolioHeader({ hidePortfolio }: { hidePortfolio: boolean }) {
  const navigation = useNavigation();

  const { allIds, seenIds } = useAnnouncements();
  const { incidents } = useFilteredServiceStatus();
  const { t } = useTranslation();

  const onNotificationButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Notification Center",
    });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenterNews,
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

  const onCardButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PlatformApp, {
      platform: "cl-card",
      name: "CL Card Powered by Ledger",
    });
  }, [navigation]);

  const notificationsCount = allIds.length - seenIds.length;

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
          <Touchable onPress={onNotificationButtonPress}>
            {notificationsCount > 0 ? (
              <NotificationsOnMedium size={24} color={"neutral.c100"} />
            ) : (
              <NotificationsMedium size={24} color={"neutral.c100"} />
            )}
          </Touchable>
        </Flex>
        <Flex mr={7}>
          <Touchable
            onPress={onCardButtonPress}
            event="button_clicked"
            eventProperties={{
              button: "card",
              screen: ScreenName.Portfolio,
            }}
          >
            <CardMedium size={24} color={"neutral.c100"} />
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

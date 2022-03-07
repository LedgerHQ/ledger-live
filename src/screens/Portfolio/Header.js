// @flow
import React, { useCallback } from "react";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useGlobalSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { Icons } from "@ledgerhq/native-ui";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Touchable from "../../components/Touchable";
import { NavigatorName } from "../../const";
import { scrollToTop } from "../../navigation/utils";
import LText from "../../components/LText";

type HeaderInformationProps = { isLoading: boolean, error?: Error | null };
const HeaderInformation = ({ isLoading, error }: HeaderInformationProps) => {
  if (error)
    return <HeaderErrorTitle withDescription withDetail error={error} />;

  if (isLoading) return <HeaderSynchronizing />;

  return null;
};

export default function PortfolioHeader() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const { allIds, seenIds } = useAnnouncements();

  const onNotificationButtonPress = useCallback(() => {
    navigation.navigate(NavigatorName.NotificationCenter);
  }, [navigation]);

  const onSettingsButtonPress = useCallback(() => {
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  const onDeviceButtonPress = useCallback(() => {
    navigation.navigate(NavigatorName.Manager);
  }, [navigation]);

  const isUpToDate = useSelector(isUpToDateSelector);
  const networkError = useSelector(networkErrorSelector);
  const { pending, error } = useGlobalSyncState();

  const notificationsCount = allIds.length - seenIds.length;

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={scrollToTop}>
        <View style={styles.content}>
          <HeaderInformation
            isLoading={pending && !isUpToDate}
            error={networkError || error}
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={[styles.distributionButton, styles.marginLeft]}>
        <Touchable onPress={onNotificationButtonPress}>
          {notificationsCount > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.alert,
                },
              ]}
            >
              <LText bold style={styles.badgeLabel}>
                {notificationsCount}
              </LText>
            </View>
          )}
          <Icons.NotificationsMedium size={24} color={colors.grey} />
        </Touchable>
      </View>
      <View style={[styles.distributionButton, styles.marginLeft]}>
        <Touchable onPress={onSettingsButtonPress}>
          <Icons.SettingsMedium size={24} color={colors.grey} />
        </Touchable>
      </View>
      <View style={[styles.distributionButton, styles.marginLeft]}>
        <Touchable onPress={onDeviceButtonPress}>
          <Icons.NanoFoldedMedium size={24} color={colors.grey} />
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
  distributionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 32,
    alignSelf: "center",
  },
  marginLeft: { marginLeft: 24 },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 15,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: -8,
    right: -8,
    zIndex: 2,
  },
  badgeLabel: { fontSize: 8, color: "#FFF" },
});

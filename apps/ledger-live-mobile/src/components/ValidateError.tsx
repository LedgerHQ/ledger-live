import React, { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme, useNavigation } from "@react-navigation/native";
import GenericErrorView from "./GenericErrorView";
import Button from "./Button";
import NeedHelp from "./NeedHelp";
import { BaseNavigation } from "./RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { MANAGER_TABS } from "~/const/manager";
import { LatestFirmwareVersionRequired } from "@ledgerhq/live-common/errors";
import { UpdateYourApp } from "@ledgerhq/errors";
import { RequiredFirmwareUpdate } from "./DeviceAction/rendering";
import { useSelector } from "react-redux";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { LedgerError } from "~/types/error";

type Props = {
  error: LedgerError;
  onClose: () => void;
  onRetry?: () => void;
};

function ValidateError({ error, onClose, onRetry }: Props) {
  const navigation = useNavigation<BaseNavigation>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const managerAppName = error instanceof UpdateYourApp ? error.managerAppName : undefined;

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const onPress = useCallback(() => {
    if (managerAppName && navigation) {
      navigation.navigate(NavigatorName.Base, {
        screen: NavigatorName.Main,
        params: {
          screen: NavigatorName.MyLedger,
          params: {
            screen: ScreenName.MyLedgerChooseDevice,
            params: {
              tab: MANAGER_TABS.INSTALLED_APPS,
              updateModalOpened: true,
              device: lastConnectedDevice,
            },
          },
        },
      });
    } else if (onRetry) {
      onRetry();
    }
  }, [lastConnectedDevice, managerAppName, navigation, onRetry]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.container}>
        {error instanceof LatestFirmwareVersionRequired && lastConnectedDevice ? (
          <RequiredFirmwareUpdate t={t} navigation={navigation} device={lastConnectedDevice} />
        ) : (
          <>
            <GenericErrorView error={error} hasExportLogButton={!managerAppName} />
            <Button
              event={managerAppName ? "SendErrorOpenManager" : "SendErrorRetry"}
              title={managerAppName ? t("DeviceAction.button.openManager") : t("common.retry")}
              type="primary"
              containerStyle={styles.button}
              onPress={onPress}
            />
            <Button
              event="SendErrorClose"
              title={t("common.close")}
              type="lightSecondary"
              containerStyle={styles.button}
              onPress={onClose}
            />
          </>
        )}
      </View>
      <View
        style={[
          styles.footer,
          {
            borderColor: colors.lightFog,
          },
        ]}
      >
        <NeedHelp />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});

export default memo<Props>(ValidateError);

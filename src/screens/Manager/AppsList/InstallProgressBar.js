import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, Linking, Platform } from "react-native";
import { Trans } from "react-i18next";

import type { State } from "@ledgerhq/live-common/lib/apps";
import { isLiveSupportedApp } from "@ledgerhq/live-common/lib/apps/logic";

import { urls } from "../../../config/urls";

import colors from "../../../colors";
import { NavigatorName } from "../../../const";
import Styles from "../../../navigation/styles";
import ToastBar from "../../../components/ToastBar";

type Props = {
  state: State,
  navigation: *,
  disable: boolean,
};

const InstallSuccessBar = ({ state, navigation, disable }: Props) => {
  const [hasBeenShown, setHasBeenShown] = useState(disable);
  const {
    installQueue,
    uninstallQueue,
    recentlyInstalledApps,
    appByName,
    installed,
  } = state;

  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.AddAccounts);
    setHasBeenShown(true);
  }, [navigation]);

  const onSupportLink = useCallback(() => {
    Linking.openURL(urls.appSupport);
    setHasBeenShown(true);
  }, []);

  const successInstalls = useMemo(
    () =>
      !hasBeenShown && installQueue.length <= 0 && uninstallQueue.length <= 0
        ? recentlyInstalledApps
            .filter(appName => installed.some(({ name }) => name === appName))
            .map(name => appByName[name])
        : [],
    [
      appByName,
      hasBeenShown,
      installQueue.length,
      recentlyInstalledApps,
      uninstallQueue.length,
      installed,
    ],
  );

  const hasLiveSupported = useMemo(
    () => successInstalls.find(isLiveSupportedApp),
    [successInstalls],
  );

  const onClose = useCallback(() => setHasBeenShown(true), []);

  return (
    <ToastBar
      isOpened={successInstalls.length >= 1}
      onClose={onClose}
      containerStyle={styles.containerStyle}
      type={"primary"}
      title={
        <>
          {hasLiveSupported ? (
            successInstalls.length === 1 ? (
              <Trans
                i18nKey="manager.installSuccess.title"
                values={{ app: successInstalls[0].name }}
              />
            ) : (
              <Trans i18nKey="manager.installSuccess.title_plural" />
            )
          ) : (
            <Trans i18nKey="manager.installSuccess.notSupported" />
          )}
        </>
      }
      secondaryAction={{
        title: <Trans i18nKey="manager.installSuccess.later" />,
        onPress: onClose,
      }}
      primaryAction={
        hasLiveSupported
          ? {
              title: <Trans i18nKey="manager.installSuccess.manageAccount" />,
              useTouchable: true,
              onPress: onAddAccount,
              event: "ManagerAddAccount",
            }
          : {
              title: <Trans i18nKey="manager.installSuccess.learnMore" />,
              onPress: onSupportLink,
            }
      }
    />
  );
};

const styles = StyleSheet.create({
  root: {
    ...Styles.headerNoShadow,
    width: "100%",
    bottom: -20,
    left: -20,
    position: "absolute",
    zIndex: 10,
    overflow: "hidden",
    paddingTop: Platform.OS === "ios" ? 24 : 0,
    height: 100,
    flexDirection: "row",
  },
  containerStyle: {
    backgroundColor: colors.live,
  },
  warnText: {
    textAlign: "center",
    fontSize: 14,
    color: colors.white,
    lineHeight: 16,
  },
  storageRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
    color: colors.white,
  },
  buttonMargin: {
    marginLeft: 16,
  },
});

export default InstallSuccessBar;

import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, Linking, Platform } from "react-native";
import { Trans } from "react-i18next";

import type { State } from "@ledgerhq/live-common/lib/apps";

import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { isCurrencySupported } from "@ledgerhq/live-common/lib/data/cryptocurrencies";

import { urls } from "../../../config/urls";

import colors from "../../../colors";
import Styles from "../../../navigation/styles";
import ToastBar from "../../../components/ToastBar";

type Props = {
  state: State,
  navigation: *,
};

let installs = new Set([]);

const InstallProgressBar = ({ state, navigation }: Props) => {
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [installSuccess, setInstallSuccess] = useState([]);
  const [hasLiveSupported, setHasLiveSupported] = useState(false);
  const { installQueue, uninstallQueue, installed, appByName } = state;

  const onAddAccount = useCallback(() => {
    navigation.navigate("AddAccounts");
    setInstallSuccess([]);
    setHasBeenShown(true);
  }, [navigation]);

  const onSupportLink = useCallback(() => {
    Linking.openURL(urls.appSupport);
    setHasBeenShown(true);
  }, []);

  const onInstallSuccess = useCallback(() => {
    const installArray = Array.from(installs)
      .map(n => appByName[n])
      .filter(
        app => app && installed.findIndex(ins => ins.name === app.name) >= 0,
      );
    setInstallSuccess(installArray);

    const hasLiveSupport = installArray.some(
      app =>
        app.currencyId &&
        isCurrencySupported(getCryptoCurrencyById(app.currencyId)),
    );
    setHasLiveSupported(hasLiveSupport);
    installs = new Set([]);
  }, [appByName, installed]);

  useEffect(() => {
    if (!hasBeenShown) {
      if (installQueue.length > 0) {
        installs = new Set([...installs, ...installQueue]);
        setInstallSuccess([]);
      } else {
        setTimeout(onInstallSuccess, 200);
      }
    }
  }, [hasBeenShown, installQueue, onInstallSuccess]);

  useEffect(() => {
    if (uninstallQueue.length > 0 && installSuccess.length > 0) {
      setInstallSuccess([]);
      installs = new Set([]);
    }
  }, [installSuccess.length, uninstallQueue]);

  const onClose = useCallback(() => setInstallSuccess([]), [setInstallSuccess]);

  return (
    <ToastBar
      isOpened={installSuccess.length >= 1}
      onClose={onClose}
      containerStyle={styles.containerStyle}
      type={"primary"}
      title={
        <>
          <Trans i18nKey="manager.installSuccess.title" />{" "}
          {hasLiveSupported ? (
            installSuccess.length === 1 ? (
              <Trans
                i18nKey="manager.installSuccess.subtitle"
                values={{ appName: installSuccess[0].name }}
              />
            ) : (
              <Trans i18nKey="manager.installSuccess.subtitle_plural" />
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

export default InstallProgressBar;

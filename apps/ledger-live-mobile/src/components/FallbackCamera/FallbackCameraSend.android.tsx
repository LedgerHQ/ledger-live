import React, { memo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AppState, AppStateStatus, Linking } from "react-native";
import FallbackCameraBody from "../FallbackCameraBody";
import type { Navigation } from "./FallbackCameraSend";

const FallBackCameraScreen = ({ route, navigation }: Navigation) => {
  const { t } = useTranslation();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const appState = useRef(AppState.currentState);
  const openSettingsPressed = useRef(false);

  const openNativeSettings = useCallback(() => {
    openSettingsPressed.current = true;
    Linking.openSettings();
    forceUpdate();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        openSettingsPressed.current &&
        route.params.screenName
      ) {
        navigation.replace(route.params.screenName);
      }

      appState.current = nextAppState;
      forceUpdate();
    };

    const listener = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (listener) {
        listener.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FallbackCameraBody
      title={t("send.scan.fallback.title")}
      description={t("send.scan.fallback.desc")}
      buttonTitle={t("send.scan.fallback.buttonTitle")}
      onPress={openNativeSettings}
    />
  );
};

export default memo(FallBackCameraScreen);

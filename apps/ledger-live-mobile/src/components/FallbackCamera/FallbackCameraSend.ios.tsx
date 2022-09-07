import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import FallbackCameraBody from "../FallbackCameraBody";

export default function FallBackCameraScreen() {
  const { t } = useTranslation();
  const openNativeSettings = useCallback(() => {
    Linking.openURL("app-settings:");
  }, []);
  return (
    <FallbackCameraBody
      title={t("send.scan.fallback.title")}
      description={t("send.scan.fallback.desc")}
      buttonTitle={t("send.scan.fallback.buttonTitle")}
      onPress={openNativeSettings}
    />
  );
}

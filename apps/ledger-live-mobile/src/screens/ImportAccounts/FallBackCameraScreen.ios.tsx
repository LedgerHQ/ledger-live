import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import FallbackCameraBody from "../../components/FallbackCameraBody";

export default function FallBackCameraScreen() {
  const { t } = useTranslation();
  const openNativeSettings = useCallback(() => {
    Linking.openURL("app-settings:");
  }, []);
  return (
    <FallbackCameraBody
      title={t("account.import.fallback.title")}
      description={t("account.import.fallback.desc")}
      buttonTitle={t("account.import.fallback.buttonTitle")}
      onPress={openNativeSettings}
    />
  );
}

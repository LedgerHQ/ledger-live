import React, { memo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import SettingsRow from "../../../components/SettingsRow";
import { urls } from "../../../config/urls";
import { useLocale } from "../../../context/Locale";

function PrivacyPolicyRow() {
  const { locale } = useLocale();
  return (
    <SettingsRow
      event="PrivacyPolicyRow"
      title={<Trans i18nKey="settings.about.privacyPolicy" />}
      desc={<Trans i18nKey="settings.about.privacyPolicyDesc" />}
      onPress={() => Linking.openURL(urls.privacyPolicy[locale || "en"])}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(PrivacyPolicyRow);

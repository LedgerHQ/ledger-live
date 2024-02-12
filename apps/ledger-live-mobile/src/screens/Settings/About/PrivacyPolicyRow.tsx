import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import SettingsRow from "~/components/SettingsRow";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";

function PrivacyPolicyRow() {
  const { locale } = useLocale();

  const onPrivacyLink = useCallback(
    () =>
      Linking.openURL(
        (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en,
      ),
    [locale],
  );
  return (
    <SettingsRow
      event="PrivacyPolicyRow"
      title={<Trans i18nKey="settings.about.privacyPolicy" />}
      desc={<Trans i18nKey="settings.about.privacyPolicyDesc" />}
      onPress={onPrivacyLink}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(PrivacyPolicyRow);

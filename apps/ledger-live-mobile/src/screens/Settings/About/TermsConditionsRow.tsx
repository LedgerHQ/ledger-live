import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";

import SettingsRow from "~/components/SettingsRow";
import { useLocalizedTermsUrl } from "~/logic/terms";

const TermsConditionsRow = () => {
  const termsUrl = useLocalizedTermsUrl();

  const onClick = useCallback(() => {
    Linking.openURL(termsUrl);
  }, [termsUrl]);

  return (
    <>
      <SettingsRow
        event="TermsConditionsRow"
        title={<Trans i18nKey="settings.about.termsConditions" />}
        desc={<Trans i18nKey="settings.about.termsConditionsDesc" />}
        onPress={onClick}
      >
        <ExternalLinkMedium size={20} color={"neutral.c100"} />
      </SettingsRow>
    </>
  );
};

export default memo(TermsConditionsRow);

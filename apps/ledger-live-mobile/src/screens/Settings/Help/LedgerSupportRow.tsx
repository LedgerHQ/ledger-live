import React, { memo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { urls } from "~/utils/urls";
import SettingsRow from "~/components/SettingsRow";

function LedgerSupportRow() {
  return (
    <SettingsRow
      event="LedgerSupportRow"
      title={<Trans i18nKey="settings.help.support" />}
      desc={<Trans i18nKey="settings.help.supportDesc" />}
      onPress={() => Linking.openURL(urls.faq)}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(LedgerSupportRow);

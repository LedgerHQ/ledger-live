import React, { memo } from "react";
import { Trans } from "~/context/Locale";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { urls } from "~/utils/urls";
import SettingsRow from "~/components/SettingsRow";

function LedgerAcademyRow() {
  return (
    <SettingsRow
      event="LedgerAcademyRow"
      title={<Trans i18nKey="settings.help.ledgerAcademy" />}
      desc={<Trans i18nKey="settings.help.ledgerAcademyDesc" />}
      onPress={() => Linking.openURL(urls.ledgerAcademy.root)}
      testID={`ledger-academy-row-${urls.ledgerAcademy.root}`}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(LedgerAcademyRow);

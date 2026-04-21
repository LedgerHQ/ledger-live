import React, { memo } from "react";
import { Trans } from "~/context/Locale";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import SettingsRow from "~/components/SettingsRow";

function LedgerAcademyRow() {
  const ledgerAcademyUrl = useLocalizedUrl(urls.resources.ledgerAcademy);

  return (
    <SettingsRow
      event="LedgerAcademyRow"
      title={<Trans i18nKey="settings.help.ledgerAcademy" />}
      desc={<Trans i18nKey="settings.help.ledgerAcademyDesc" />}
      onPress={() => Linking.openURL(ledgerAcademyUrl)}
      testID={`ledger-academy-row-${ledgerAcademyUrl}`}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(LedgerAcademyRow);

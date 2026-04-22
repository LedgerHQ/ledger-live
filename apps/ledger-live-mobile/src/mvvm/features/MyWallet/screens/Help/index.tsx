import React from "react";
import { ScrollView } from "react-native";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { LifeRing, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { useMyWalletHelpViewModel } from "./useMyWalletHelpViewModel";
import { HelpListItem } from "./components/HelpListItem";

export function MyWalletHelpScreen() {
  const { t } = useTranslation();
  const { isChatbotEnabled, onLedgerSupportPress, onLedgerAcademyPress } =
    useMyWalletHelpViewModel();

  return (
    <ScrollView testID="my-wallet-help-screen">
      <TrackScreen category="MyWallet" name="Help" />
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", gap: "s24" }}>
        <Box lx={{ gap: "s8" }}>
          <Subheader>
            <SubheaderRow testID="my-wallet-help-section-support">
              <SubheaderTitle>{t("myWallet.help.sections.supportAndLearning")}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          <HelpListItem
            onPress={onLedgerSupportPress}
            testID="help-ledger-support-row"
            icon={LifeRing}
            title={
              isChatbotEnabled ? t("help.chatbot") : t("myWallet.help.rows.ledgerSupport.title")
            }
            description={t("myWallet.help.rows.ledgerSupport.description")}
          />
          <HelpListItem
            onPress={onLedgerAcademyPress}
            testID="help-ledger-academy-row"
            icon={Information}
            title={t("myWallet.help.rows.ledgerAcademy.title")}
            description={t("myWallet.help.rows.ledgerAcademy.description")}
          />
        </Box>

        <Subheader>
          <SubheaderRow testID="my-wallet-help-section-more">
            <SubheaderTitle>{t("myWallet.help.sections.more")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      </Box>
    </ScrollView>
  );
}

import React from "react";
import { ScrollView } from "react-native";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";

export function MyWalletHelpScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView testID="my-wallet-help-screen">
      <TrackScreen category="MyWallet" name="Help" />
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", gap: "s24" }}>
        <Subheader>
          <SubheaderRow testID="my-wallet-help-section-support">
            <SubheaderTitle>{t("myWallet.help.sections.supportAndLearning")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
        <Subheader>
          <SubheaderRow testID="my-wallet-help-section-more">
            <SubheaderTitle>{t("myWallet.help.sections.more")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      </Box>
    </ScrollView>
  );
}

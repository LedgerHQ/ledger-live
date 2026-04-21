import React from "react";
import { Box, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import LedgerSupportRow from "./LedgerSupportRow";
import LedgerAcademyRow from "./LedgerAcademyRow";
import ClearCacheRow from "./ClearCacheRow";
import ExportLogsRow from "./ExportLogsRow";
import HardResetRow from "./HardResetRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";

export default function HelpSettings() {
  const { t } = useTranslation();

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Help" />
      <Box mx={6} mt={4} mb={2}>
        <Text variant="large" fontWeight="semiBold" color="neutral.c100">
          {t("settings.help.supportAndLearning")}
        </Text>
      </Box>
      <LedgerSupportRow />
      <LedgerAcademyRow />
      <ExportLogsRow />
      <ClearCacheRow />
      <HardResetRow />
    </SettingsNavigationScrollView>
  );
}

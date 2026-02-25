import React from "react";
import { Trans } from "~/context/Locale";
import SettingsRow from "~/components/SettingsRow";
import useExportLogs from "~/components/useExportLogs";

export default function ExportLogsRow() {
  const exportLogs = useExportLogs();

  return (
    <SettingsRow
      event="ExportLogsRow"
      title={<Trans i18nKey="settings.help.exportLogs" />}
      desc={<Trans i18nKey="settings.help.exportLogsDesc" />}
      arrowRight
      onPress={exportLogs}
      testID="export-logs-row"
    />
  );
}

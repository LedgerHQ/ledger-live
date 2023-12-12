import React from "react";
import { Trans } from "react-i18next";
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
    />
  );
}

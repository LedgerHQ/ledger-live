// @flow

import { useCallback } from "react";
import VersionNumber from "react-native-version-number";
import Share from "react-native-share";
import cleanBuildVersion from "../logic/cleanBuildVersion";
import logger from "../logger";
import logReport from "../log-report";

export default function useExportLogs() {
  const onExport = useCallback(() => {
    const exportLogs = async () => {
      const logs = logReport.getLogs();
      const base64 = Buffer.from(JSON.stringify(logs)).toString("base64");
      const { appVersion, buildVersion } = VersionNumber;
      const version = `${appVersion || ""}-(${cleanBuildVersion(buildVersion) ||
        ""})`;
      const date = new Date().toISOString().split("T")[0];

      const humanReadableName = `ledger-live-mob-${version}-${date}-logs`;

      const options = {
        failOnCancel: false,
        saveToFiles: true,
        type: "application/json",
        filename: humanReadableName,
        url: `data:application/json;base64,${base64}`,
      };

      try {
        await Share.open(options);
      } catch (err) {
        if (err.error.code !== "ECANCELLED500") {
          logger.critical(err);
        }
      }
    };
    exportLogs();
  }, []);

  return onExport;
}

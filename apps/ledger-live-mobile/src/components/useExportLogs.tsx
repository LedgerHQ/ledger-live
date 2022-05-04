import { useCallback } from "react";
import Share from "react-native-share";
import logger from "../logger";
import logReport from "../log-report";
import getFullAppVersion from "../logic/version";

export default function useExportLogs() {
  return useCallback(() => {
    const exportLogs = async () => {
      const logs = logReport.getLogs();
      const base64 = Buffer.from(JSON.stringify(logs)).toString("base64");
      const version = getFullAppVersion(undefined, undefined, "-");
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
}

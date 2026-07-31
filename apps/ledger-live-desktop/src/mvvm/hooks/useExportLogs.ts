import { getAllEnvs } from "@shared/env";
import { userIdSelector } from "@domain/entity-client-identity";
import { getResourceUsage } from "~/renderer/webFrame";
import { showSaveDialog } from "~/renderer/dialog";
import { useCallback, useState } from "react";
import { useTechnicalDateTimeFn } from "~/renderer/hooks/useDateFormatter";
import logger from "~/renderer/logger";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { saveLogs } from "~/helpers/saveLogs";

export function useExportLogs() {
  const getDateTxt = useTechnicalDateTimeFn();
  const accounts = useSelector(accountsSelector);
  const userId = useSelector(userIdSelector);
  const [exporting, setExporting] = useState(false);

  const exportLogs = useCallback(async () => {
    try {
      const resourceUsage = getResourceUsage();
      logger.log("exportLogsMeta", {
        resourceUsage,
        release: __APP_VERSION__,
        git_commit: __GIT_REVISION__,
        environment: __DEV__ ? "development" : "production",
        userAgent: window.navigator.userAgent,
        userAnonymousId: userId.exportUserIdForUserLogs(),
        env: getAllEnvs(),
        accountsIds: accounts.map(a => a.id),
      });

      const path = await showSaveDialog({
        title: "Export logs",
        defaultPath: `ledgerwallet-logs-${getDateTxt()}-${__GIT_REVISION__ || "unversioned"}.txt`,
        filters: [{ name: "All Files", extensions: ["txt"] }],
      });

      if (path) {
        await saveLogs(path);
      }
    } catch (error) {
      logger.critical(error as Error);
    }
  }, [accounts, getDateTxt, userId]);

  const handleExportLogs = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    await exportLogs();
    setExporting(false);
  }, [exporting, exportLogs]);

  return { handleExportLogs };
}

import getUser from "~/helpers/user";
import { getAllEnvs } from "@ledgerhq/live-env";
import { webFrame, ipcRenderer } from "electron";
import { useCallback, useState } from "react";
import { useTechnicalDateTimeFn } from "~/renderer/hooks/useDateFormatter";
import logger from "~/renderer/logger";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { saveLogs } from "~/helpers/saveLogs";

export function useExportLogs() {
  const getDateTxt = useTechnicalDateTimeFn();
  const accounts = useSelector(accountsSelector);
  const [exporting, setExporting] = useState(false);

  const savelogsCB = useCallback(saveLogs, []);

  const exportLogs = useCallback(async () => {
    try {
      const resourceUsage = webFrame.getResourceUsage();
      const user = await getUser();
      logger.log("exportLogsMeta", {
        resourceUsage,
        release: __APP_VERSION__,
        git_commit: __GIT_REVISION__,
        environment: __DEV__ ? "development" : "production",
        userAgent: window.navigator.userAgent,
        userAnonymousId: user.id,
        env: getAllEnvs(),
        accountsIds: accounts.map(a => a.id),
      });

      const path = await ipcRenderer.invoke("show-save-dialog", {
        title: "Export logs",
        defaultPath: `ledgerlive-logs-${getDateTxt()}-${__GIT_REVISION__ || "unversioned"}.txt`,
        filters: [{ name: "All Files", extensions: ["txt"] }],
      });

      if (path) {
        await savelogsCB(path);
      }
    } catch (error) {
      logger.critical(error as Error);
    }
  }, [accounts, getDateTxt, savelogsCB]);

  const handleExportLogs = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    await exportLogs();
    setExporting(false);
  }, [exporting, exportLogs]);

  return { handleExportLogs };
}

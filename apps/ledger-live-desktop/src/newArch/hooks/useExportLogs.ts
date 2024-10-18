import getUser from "~/helpers/user";
import { getAllEnvs } from "@ledgerhq/live-env";
import { webFrame, ipcRenderer } from "electron";
import { useCallback, useState } from "react";
import { useTechnicalDateTimeFn } from "~/renderer/hooks/useDateFormatter";
import logger, { memoryLogger } from "~/renderer/logger";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";

export function useExportLogs() {
  const getDateTxt = useTechnicalDateTimeFn();
  const accounts = useSelector(accountsSelector);
  const [exporting, setExporting] = useState(false);

  const saveLogs = useCallback(async (path: Electron.SaveDialogReturnValue) => {
    try {
      const memoryLogsStr = JSON.stringify(memoryLogger.getMemoryLogs(), null, 2);
      await ipcRenderer.invoke("save-logs", path, memoryLogsStr);
    } catch (error) {
      console.error("Error while requesting to save logs from the renderer process", error);
    }
  }, []);

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
        defaultPath: `ledgerlive-logs-${getDateTxt()}-${__GIT_REVISION__ || "unversioned"}.json`,
        filters: [{ name: "All Files", extensions: ["json"] }],
      });

      if (path) {
        await saveLogs(path);
      }
    } catch (error) {
      logger.critical(error as Error);
    }
  }, [accounts, getDateTxt, saveLogs]);

  const handleExportLogs = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    await exportLogs();
    setExporting(false);
  }, [exporting, exportLogs]);

  return { handleExportLogs };
}

import moment from "moment";
import { ipcRenderer, webFrame } from "electron";
import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getAllEnvs } from "@ledgerhq/live-env";
import { Account } from "@ledgerhq/types-live";
import KeyHandler from "react-key-handler";
import logger, { memoryLogger } from "~/renderer/logger";
import getUser from "~/helpers/user";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
import { accountsSelector } from "~/renderer/reducers/accounts";

const saveLogs = async (path: Electron.SaveDialogReturnValue) => {
  const memoryLogs = memoryLogger.getMemoryLogs();

  try {
    // Serializes ourself with `stringify` to avoid "object could not be cloned" errors from the electron IPC serializer.
    const memoryLogsStr = JSON.stringify(memoryLogs, null, 2);

    // Requests the main process to save logs in a file
    await ipcRenderer.invoke("save-logs", path, memoryLogsStr);
  } catch (error) {
    console.error("Error while requesting to save logs from the renderer process", error);
  }
};

type RestProps = ButtonProps & {
  icon?: boolean;
  inverted?: boolean;
  // only used with primary for now
  lighterPrimary?: boolean;
  danger?: boolean;
  lighterDanger?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  event?: string;
  eventProperties?: object;
  outline?: boolean;
  outlineGrey?: boolean;
};
type Props = {
  primary?: boolean;
  small?: boolean;
  hookToShortcut?: boolean;
  title?: React.ReactNode;
  withoutAppData?: boolean;
  accounts?: Account[];
  customComponent?: React.FC<() => Promise<void>>;
} & RestProps;
const ExportLogsBtnWrapper = (args: Props) => {
  if (args.withoutAppData) {
    return <ExportLogsBtn {...args} />;
  } else {
    return <ExportLogsBtnWithAccounts {...args} />;
  }
};
const ExportLogsBtnWithAccounts = (args: Props) => {
  const accounts = useSelector(accountsSelector);
  return <ExportLogsBtn {...args} accounts={accounts} />;
};
const ExportLogsBtn = ({
  hookToShortcut,
  primary = true,
  small = true,
  title,
  accounts = [],
  customComponent,
  ...rest
}: Props) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const exportLogs = useCallback(async () => {
    const resourceUsage = webFrame.getResourceUsage();
    const user = await getUser();
    logger.log("exportLogsMeta", {
      resourceUsage,
      release: __APP_VERSION__,
      git_commit: __GIT_REVISION__,
      environment: __DEV__ ? "development" : "production",
      userAgent: window.navigator.userAgent,
      userAnonymousId: user.id,
      env: {
        ...getAllEnvs(),
      },
      accountsIds: accounts.map(a => a.id),
    });
    const path = await ipcRenderer.invoke("show-save-dialog", {
      title: "Export logs",
      defaultPath: `ledgerlive-logs-${moment().format("YYYY.MM.DD-HH.mm.ss")}-${
        __GIT_REVISION__ || "unversioned"
      }.json`,
      filters: [
        {
          name: "All Files",
          extensions: ["json"],
        },
      ],
    });
    if (path) {
      await saveLogs(path);
    }
  }, [accounts]);
  const handleExportLogs = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportLogs();
    } catch (error) {
      logger.critical(error as Error);
    } finally {
      setExporting(false);
    }
  }, [exporting, setExporting, exportLogs]);
  const onKeyHandle = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey) {
        handleExportLogs();
      }
    },
    [handleExportLogs],
  );
  const text = title || t("settings.exportLogs.btn");
  if (customComponent) {
    return customComponent(handleExportLogs);
  }
  return hookToShortcut ? (
    <KeyHandler keyValue="e" onKeyHandle={onKeyHandle} />
  ) : (
    <Button small={small} primary={primary} event="ExportLogs" onClick={handleExportLogs} {...rest}>
      {text}
    </Button>
  );
};
export default ExportLogsBtnWrapper;

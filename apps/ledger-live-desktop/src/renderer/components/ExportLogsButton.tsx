import { ipcRenderer, webFrame } from "electron";
import React, { useContext, useState, useCallback } from "react";
import { ReactReduxContext } from "react-redux";
import { useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { getAllEnvs, getEnv } from "@ledgerhq/live-env";
import { Account } from "@ledgerhq/types-live";
import KeyHandler from "react-key-handler";
import type { UserId } from "@ledgerhq/client-ids/ids";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import logger from "~/renderer/logger";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useTechnicalDateTimeFn } from "../hooks/useDateFormatter";
import { saveLogs } from "~/helpers/saveLogs";

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
/** When true, we're outside Redux Provider (e.g. crash screen); omit userId from export meta. */
const ExportLogsBtnWithoutStore = (args: Props) => {
  return <ExportLogsBtnInner {...args} userId={null} />;
};

const ExportLogsBtnWrapper = (args: Props) => {
  const store = useContext(ReactReduxContext)?.store;
  const hasStore = Boolean(store);
  if (args.withoutAppData && !hasStore) {
    return <ExportLogsBtnWithoutStore {...args} />;
  }
  if (args.withoutAppData) {
    return <ExportLogsBtn {...args} />;
  }
  return <ExportLogsBtnWithAccounts {...args} />;
};
const ExportLogsBtnWithAccounts = (args: Props) => {
  const accounts = useSelector(accountsSelector);
  return <ExportLogsBtn {...args} accounts={accounts} />;
};
const ExportLogsBtn = (args: Props) => {
  const userId = useSelector(userIdSelector);
  return <ExportLogsBtnInner {...args} userId={userId} />;
};
type PropsWithUserId = Props & { userId: UserId | null };
const ExportLogsBtnInner = ({
  hookToShortcut,
  primary = true,
  small = true,
  title,
  accounts = [],
  customComponent,
  userId,
  ...rest
}: PropsWithUserId) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const getDateTxt = useTechnicalDateTimeFn();
  const exportLogs = useCallback(async () => {
    const resourceUsage = webFrame.getResourceUsage();
    logger.log("exportLogsMeta", {
      resourceUsage,
      release: __APP_VERSION__,
      git_commit: __GIT_REVISION__,
      environment: __DEV__ ? "development" : "production",
      userAgent: window.navigator.userAgent,
      ...(userId !== null && { userAnonymousId: userId.exportUserIdForUserLogs() }),
      env: {
        ...getAllEnvs(),
      },
      accountsIds: accounts.map(a => a.id),
    });

    let path;
    if (!getEnv("PLAYWRIGHT_RUN")) {
      path = await ipcRenderer.invoke("show-save-dialog", {
        title: "Export logs",
        defaultPath: `ledgerwallet-logs-${getDateTxt()}-${__GIT_REVISION__ || "unversioned"}.txt`,
        filters: [
          {
            name: "All Files",
            extensions: ["txt"],
          },
        ],
      });
    } else {
      path = {
        canceled: false,
        filePath: "./ledgerwallet-logs.txt",
      };
    }

    if (path) {
      await saveLogs(path);
    }
  }, [accounts, getDateTxt, userId]);
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
    <Button
      data-testid="export-logs-button"
      small={small}
      primary={primary}
      event="ExportLogs"
      onClick={handleExportLogs}
      {...rest}
    >
      {text}
    </Button>
  );
};
export default ExportLogsBtnWrapper;

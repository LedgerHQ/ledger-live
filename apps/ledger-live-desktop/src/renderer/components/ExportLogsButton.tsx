import { ipcRenderer, webFrame } from "electron";
import React, { useState, useCallback, useContext, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { getAllEnvs, getEnv } from "@ledgerhq/live-env";
import { Account } from "@ledgerhq/types-live";
import KeyHandler from "react-key-handler";
import logger from "~/renderer/logger";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { State } from "~/renderer/reducers";
import { useTechnicalDateTimeFn } from "../hooks/useDateFormatter";
import { saveLogs } from "~/helpers/saveLogs";
import { ReactReduxContext } from "react-redux";

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
const ExportLogsBtnWrapper = (args: Props) => <ExportLogsBtn {...args} />;
const isState = (value: unknown): value is State => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "settings" in value;
};
function useOptionalStoreSelector<T>(selector: (state: State) => T, fallback: T): T {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  return useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    () => {
      if (!store) {
        return fallback;
      }
      const storeState = store.getState();
      return isState(storeState) ? selector(storeState) : fallback;
    },
    () => {
      if (!store) {
        return fallback;
      }
      const storeState = store.getState();
      return isState(storeState) ? selector(storeState) : fallback;
    },
  );
}
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
  const getDateTxt = useTechnicalDateTimeFn();
  const userId = useOptionalStoreSelector(userIdSelector, null);
  const storeAccounts = useOptionalStoreSelector<Account[]>(accountsSelector, []);
  const effectiveAccounts = accounts.length ? accounts : storeAccounts;

  const exportLogs = useCallback(async () => {
    const resourceUsage = webFrame.getResourceUsage();
    logger.log("exportLogsMeta", {
      resourceUsage,
      release: __APP_VERSION__,
      git_commit: __GIT_REVISION__,
      environment: __DEV__ ? "development" : "production",
      userAgent: window.navigator.userAgent,
      userAnonymousId: userId?.exportUserIdForExportedLogs(),
      env: {
        ...getAllEnvs(),
      },
      accountsIds: effectiveAccounts.map(a => a.id),
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
  }, [effectiveAccounts, getDateTxt, userId]);
  const handleExportLogs = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportLogs();
    } catch (error) {
      if (error instanceof Error) {
        logger.critical(error);
      } else {
        logger.critical(new Error(String(error)));
      }
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

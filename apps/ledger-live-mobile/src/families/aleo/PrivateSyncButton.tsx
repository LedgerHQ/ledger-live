import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";

type AleoSyncState = "ready" | "running" | "complete";

const lastSyncDateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
};

export default function PrivateSyncButton({
  account,
}: {
  readonly account: AleoAccount;
}) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const { isSyncing, progress, start, stop } = useAleoPrivateSync({
    account,
    autoStart: !account.aleoResources?.lastPrivateSyncDate,
    keepAliveOnUnmount: true,
  });

  const lastSync = account.aleoResources?.lastPrivateSyncDate ?? null;
  const syncState: AleoSyncState = isSyncing ? "running" : lastSync ? "complete" : "ready";

  const formattedLastSync = useMemo(
    () => (lastSync ? new Intl.DateTimeFormat(locale, lastSyncDateFormat).format(lastSync) : ""),
    [lastSync, locale],
  );

  return (
    <Box style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12 }}>
      {syncState === "ready" && (
        <Button size="sm" onPress={start} testID="start-private-sync-button">
          {t("aleo.account.syncButton.startSync")}
        </Button>
      )}
      {syncState === "running" && (
        <Button size="sm" appearance="gray" onPress={stop} testID="stop-private-sync-button">
          {t("aleo.account.syncButton.stopSync")}
        </Button>
      )}
      {syncState === "complete" && (
        <Button size="sm" onPress={start} testID="sync-again-button">
          {t("aleo.account.syncButton.syncAgain")}
        </Button>
      )}
      {syncState === "running" && (
        <Box style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}>
          <Spinner size={12} />
          <Text typography="body4" lx={{ color: "muted" }} style={{ marginLeft: 8 }}>
            {progress}%
          </Text>
        </Box>
      )}
      {syncState === "complete" && (
        <Text typography="body4" lx={{ color: "muted" }} style={{ marginLeft: 12 }}>
          {t("aleo.account.syncButton.lastSync", { date: formattedLastSync })}
        </Text>
      )}
    </Box>
  );
}

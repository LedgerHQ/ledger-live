import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";
import { useFormatPrivateSyncDate } from "./hooks/useFormatPrivateSyncDate";

type AleoSyncState = "ready" | "running" | "complete";

export default function PrivateSyncButton({ account }: { readonly account: AleoAccount }) {
  const { t } = useTranslation();
  const formatPrivateSyncDate = useFormatPrivateSyncDate();

  const { isSyncing, progress, start, stop } = useAleoPrivateSync({
    account,
    autoStart: !account.aleoResources?.lastPrivateSyncDate,
    keepAliveOnUnmount: true,
  });

  const lastSync = account.aleoResources?.lastPrivateSyncDate ?? null;
  const syncState: AleoSyncState = isSyncing ? "running" : lastSync ? "complete" : "ready";

  const formattedLastSync = lastSync ? formatPrivateSyncDate(lastSync) : "";

  return (
    <Box
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12 }}
    >
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

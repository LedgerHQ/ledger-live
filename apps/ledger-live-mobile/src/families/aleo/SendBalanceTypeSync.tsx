import React, { useEffect } from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useTranslation } from "~/context/Locale";
import type {
  SendBalanceTypeSync,
  SendBalanceTypeSyncProps,
} from "LLM/features/Send/utils/familySendSlots";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";

function PrivateSyncProgress({ account, onComplete }: SendBalanceTypeSyncProps) {
  const { t } = useTranslation();
  const { progress, isSyncing, error, start } = useAleoPrivateSync({
    account,
    autoStart: true,
    keepAliveOnUnmount: true,
  });

  const isDone = !isSyncing && !error && progress >= 100;

  useEffect(() => {
    if (isDone) onComplete();
  }, [isDone, onComplete]);

  if (error) {
    return (
      <Box
        lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24", padding: "s24" }}
        testID="aleo-private-sync-error"
      >
        <WarningFill size={40} color="warning" />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("aleo.send.balanceTypeSync.errorTitle")}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t("aleo.send.balanceTypeSync.errorDescription")}
        </Text>
        <Button appearance="base" size="lg" onPress={start}>
          {t("common.retry")}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s16", padding: "s24" }}
      testID="aleo-private-sync"
    >
      <Spinner size={48} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("aleo.send.balanceTypeSync.title")}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("aleo.send.balanceTypeSync.description")}
      </Text>
      <Text typography="body3" lx={{ color: "muted" }} testID="aleo-private-sync-progress">
        {t("aleo.send.balanceTypeSync.progress", {
          percentage: Math.min(Math.round(progress), 100),
        })}
      </Text>
    </Box>
  );
}

const aleoSendBalanceTypeSync: SendBalanceTypeSync = {
  isRequired: ({ transaction }) =>
    transaction.family === "aleo" && isPrivateTransaction(transaction),
  Component: PrivateSyncProgress,
};

export default aleoSendBalanceTypeSync;

import React, { useEffect } from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useTranslation } from "~/context/Locale";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";

type Props = Readonly<{
  account: Account;
  transaction: Transaction;
  onComplete: () => void;
}>;

type PrivateSyncProgressProps = Omit<Props, "transaction">;

function PrivateSyncProgress({ account, onComplete }: PrivateSyncProgressProps) {
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
          {t("aleo.send.newFlowPrivateSync.errorTitle")}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t("aleo.send.newFlowPrivateSync.errorDescription")}
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
        {t("aleo.send.newFlowPrivateSync.title")}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("aleo.send.newFlowPrivateSync.description")}
      </Text>
      <Text typography="body3" lx={{ color: "muted" }} testID="aleo-private-sync-progress">
        {t("aleo.send.newFlowPrivateSync.progress", {
          percentage: Math.min(Math.round(progress), 100),
        })}
      </Text>
    </Box>
  );
}

function SkipSync({ onComplete }: Readonly<{ onComplete: () => void }>) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
}

export default function SendBalanceTypeSync({ account, transaction, onComplete }: Props) {
  if (transaction.family !== "aleo" || !isPrivateTransaction(transaction)) {
    return <SkipSync onComplete={onComplete} />;
  }

  return <PrivateSyncProgress key={account.id} account={account} onComplete={onComplete} />;
}

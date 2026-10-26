import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { isAleoAccount, isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { InfoState } from "@shared/ui-info-state";
import type {
  SendBalanceTypeSync,
  SendBalanceTypeSyncProps,
} from "LLM/features/Send/utils/familySendSlots";
import {
  useSendBalanceTypeSyncViewModel,
  type SendBalanceTypeSyncViewModel,
} from "./hooks/useSendBalanceTypeSyncViewModel";

type PrivateSyncProps = Readonly<{
  account: AleoAccount;
  transaction: Transaction;
  onComplete: () => void;
  onClose: () => void;
}>;

function SendBalanceTypeSyncView({
  viewModel,
}: Readonly<{ viewModel: SendBalanceTypeSyncViewModel }>) {
  if (viewModel.status === "error") {
    return (
      <InfoState
        preset="error"
        size="hug"
        title={viewModel.title}
        description={viewModel.description}
        primaryCta={{ label: viewModel.retryLabel, onPress: viewModel.onRetry }}
        secondaryCta={{ label: viewModel.cancelLabel, onPress: viewModel.onCancel }}
        testID="aleo-balance-type-sync-error"
      />
    );
  }

  if (viewModel.status === "recordLimit") {
    return (
      <InfoState
        preset="info"
        size="hug"
        title={viewModel.title}
        description={viewModel.description}
        primaryCta={{ label: viewModel.continueLabel, onPress: viewModel.onContinue }}
        testID="aleo-balance-type-sync-recordLimit"
      />
    );
  }

  return (
    <Box
      lx={{ alignItems: "center", gap: "s16", padding: "s24" }}
      testID="aleo-balance-type-sync-syncing"
    >
      <Spinner size={32} />
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {viewModel.title}
        </Text>
        <Text
          typography="body2"
          lx={{ color: "muted", textAlign: "center" }}
          testID="aleo-private-sync-progress"
        >
          {viewModel.progressLabel}
        </Text>
      </Box>
    </Box>
  );
}

function PrivateSync(props: PrivateSyncProps) {
  const viewModel = useSendBalanceTypeSyncViewModel(props);

  return <SendBalanceTypeSyncView viewModel={viewModel} />;
}

function AleoSendBalanceTypeSync({
  account,
  transaction,
  onComplete,
  onClose,
}: SendBalanceTypeSyncProps) {
  if (!isAleoAccount(account) || transaction.family !== "aleo") return null;

  return (
    <PrivateSync
      account={account}
      transaction={transaction}
      onComplete={onComplete}
      onClose={onClose}
    />
  );
}

const aleoSendBalanceTypeSync: SendBalanceTypeSync = {
  isRequired: ({ transaction }) => {
    return transaction.family === "aleo" && isPrivateTransaction(transaction);
  },
  Component: AleoSendBalanceTypeSync,
};

export default aleoSendBalanceTypeSync;

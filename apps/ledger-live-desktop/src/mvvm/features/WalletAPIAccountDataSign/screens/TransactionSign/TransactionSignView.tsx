import React from "react";
import { useTranslation } from "react-i18next";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { SignReviewDialog } from "../../components/SignReviewDialog";
import { SummaryRow } from "../../components/SummaryRow";
import { CONNECTION_PARAMS, noop } from "../../utils/executorDefaults";
import type { useTransactionSignViewModel } from "./useTransactionSignViewModel";

type Props = ReturnType<typeof useTransactionSignViewModel>;

export function TransactionSignView({
  step,
  summary,
  canConfirm,
  confirm,
  cancel,
  close,
  intent,
  initializationInput,
  onIntentJobError,
}: Props) {
  const { t } = useTranslation();

  if (step === "signing" && initializationInput) {
    return (
      <DeviceIntentExecutor
        enabled
        sourceFlow="wallet_api"
        deviceConnectionParams={CONNECTION_PARAMS}
        deviceInitializationInput={initializationInput}
        intent={intent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobComplete={close}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={cancel}
      />
    );
  }

  return (
    <SignReviewDialog
      title={t("platform.accountDataSign.transaction.title")}
      confirmLabel={t("platform.accountDataSign.confirm")}
      canConfirm={canConfirm}
      onConfirm={confirm}
      onCancel={cancel}
      testID="wallet-api-account-data-sign-transaction"
    >
      <SummaryRow
        label={t("platform.accountDataSign.transaction.recipient")}
        value={summary.recipient}
        testID="wallet-api-account-data-sign-recipient"
      />
      <SummaryRow
        label={t("platform.accountDataSign.transaction.amount")}
        value={summary.amount}
        testID="wallet-api-account-data-sign-amount"
      />
      <SummaryRow
        label={t("platform.accountDataSign.transaction.fees")}
        value={summary.fees}
        testID="wallet-api-account-data-sign-fees"
      />
      <SummaryRow
        label={t("platform.accountDataSign.transaction.total")}
        value={summary.total}
        testID="wallet-api-account-data-sign-total"
      />
      {summary.errors.map(message => (
        <Banner key={message} appearance="error" title={message} />
      ))}
      {summary.warnings.map(message => (
        <Banner key={message} appearance="warning" title={message} />
      ))}
    </SignReviewDialog>
  );
}

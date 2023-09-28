import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import Alert from "~/renderer/components/Alert";
import AsaSelector from "../fields/AsaSelector";
export default function StepAsset({
  account,
  onUpdateTransaction,
  transaction,
  warning,
  error,
  t,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = getAccountBridge(account);
  const onUpdateAsset = useCallback(
    (t?: TokenCurrency | null) => {
      // NOTE: to match the signature of AsaSelector, i had to change a bit the function
      if (!t) return;
      const { id: assetId } = t;
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          assetId,
        }),
      );
    },
    [bridge, onUpdateTransaction],
  );
  return (
    <Box flow={1}>
      <TrackPage category="OptIn Flow" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <AsaSelector transaction={transaction} account={account} t={t} onChange={onUpdateAsset} />
      <Alert type="primary">
        <Trans i18nKey="algorand.optIn.flow.steps.assets.info" />
      </Alert>
    </Box>
  );
}
export function StepAssetFooter({
  transitionTo,
  account,
  onClose,
  status,
  bridgePending,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import ErrorDisplay from "../../shared/components/ErrorDisplay";
import AmountField from "../fields/AmountField";
import ValidatorField from "../fields/ValidatorField";
import { StepProps } from "../types";
import BigNumber from "bignumber.js";
import { MappedStake } from "@ledgerhq/live-common/families/sui/types";

export default function StepAmount({
  account,
  transaction,
  status,
  error,
  onUpdateTransaction,
}: StepProps) {
  const { t } = useTranslation();

  const [staked, setStaked] = useState(transaction.amount);
  const bridge = getAccountBridge(account);

  const updateAmount = useCallback(
    (amount: BigNumber) => {
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          ...tx,
          amount,
          useAllAmount: amount.eq(staked),
        }),
      );
    },
    [onUpdateTransaction, bridge, staked],
  );

  const updateValidator = useCallback(
    ({ stakedSuiId, amount }: { stakedSuiId: string; amount: BigNumber }) => {
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          ...tx,
          stakedSuiId,
          amount,
          useAllAmount: amount.eq(staked),
        }),
      );
    },
    [onUpdateTransaction, bridge, staked],
  );
  const onChangeValidator = useCallback(
    (item?: MappedStake | null) => {
      if (!item) return;
      setStaked(BigNumber(item.principal));
      updateValidator({
        stakedSuiId: item.stakedSuiId,
        amount: BigNumber(item.principal),
      });
    },
    [updateValidator],
  );

  return (
    <Box flow={1}>
      <TrackPage
        category="Sui Undelegate"
        name="Step Amount"
        flow="stake"
        action="undelegate"
        currency="sui"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorField account={account} transaction={transaction} onChange={onChangeValidator} />
      <Label>{t("send.steps.details.amount")}</Label>
      {transaction ? (
        <AmountField
          key={transaction.recipient}
          account={account}
          status={status}
          onChange={updateAmount}
          amount={transaction.amount}
          available={staked}
        />
      ) : null}
      {status.errors.fee && <ErrorDisplay error={status.errors.fee} />}
    </Box>
  );
}
export function StepAmountFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) {
  const { t } = useTranslation();
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          disabled={!canNext}
          isLoading={bridgePending}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}

import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { StepProps } from "../types";
import { NearMappedStakingPosition } from "@ledgerhq/live-common/families/near/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { ValidatorField, AmountField } from "../fields";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
export default function StepAmount({
  account,
  transaction,
  onUpdateTransaction,
  status,
  error,
}: StepProps) {
  invariant(account && account.nearResources && transaction, "account and transaction required");
  const [staked, setStaked] = useState(transaction.amount);
  const bridge = getAccountBridge(account);
  const updateValidator = useCallback(
    ({ address, amount }) => {
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          ...tx,
          recipient: address || tx.recipient,
          amount,
          useAllAmount: amount.eq(staked),
        }),
      );
    },
    [onUpdateTransaction, bridge, staked],
  );
  const onChangeValidator = useCallback(
    ({ validatorId, staked }: NearMappedStakingPosition) => {
      setStaked(staked);
      updateValidator({
        address: validatorId,
        amount: staked,
      });
    },
    [updateValidator],
  );
  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      updateValidator({
        amount,
        address: "",
      });
    },
    [updateValidator],
  );
  const validator = useMemo(() => {
    return {
      validatorAddress: transaction.recipient,
      amount: transaction.amount,
    };
  }, [transaction]);
  const amount = useMemo(() => (validator ? validator.amount : new BigNumber(0)), [validator]);
  return (
    <Box flow={1}>
      <TrackPage category="Unstaking Flow" name="Step 1" />
      {error && <ErrorBanner error={error} />}
      <Box horizontal justifyContent="center" mb={2}>
        <Text ff="Inter|Medium" fontSize={4}>
          <Trans i18nKey="near.unstake.flow.steps.amount.subtitle">
            <b></b>
          </Trans>
        </Text>
      </Box>
      <ValidatorField account={account} transaction={transaction} onChange={onChangeValidator} />
      <AmountField
        amount={amount}
        validator={validator}
        account={account}
        status={status}
        onChange={onChangeAmount}
        label={<Trans i18nKey="near.unstake.flow.steps.amount.fields.amount" />}
      />
      <Alert info="primary" mt={2}>
        <Trans i18nKey="near.unstake.flow.steps.amount.warning">
          <b></b>
        </Trans>
      </Alert>
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
  transaction,
}: StepProps) {
  const { t } = useTranslation();
  invariant(account, "account required");
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
        <Button disabled={!canNext} primary onClick={() => transitionTo("device")}>
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}

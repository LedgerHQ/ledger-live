import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { StepProps } from "../types";
import { CosmosMappedDelegation, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { TrackPage } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { ValidatorField, AmountField } from "../fields";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import NotEnoughFundsToUnstake from "~/renderer/components/NotEnoughFundsToUnstake";
import { resolveTransactionValidators } from "@ledgerhq/coin-cosmos/buildTransaction";

export default function StepAmount({
  account,
  transaction,
  onUpdateTransaction,
  status,
  error,
  onClose,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account);
  const onChangeValidator = useCallback(
    (delegation?: CosmosMappedDelegation | null) => {
      if (!delegation) return;
      const { validatorAddress, amount } = delegation;
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, { valAddress: validatorAddress, amount }),
      );
    },
    [onUpdateTransaction, bridge],
  );
  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount }));
    },
    [onUpdateTransaction, bridge],
  );
  const validator = useMemo(
    () => ({ address: transaction.valAddress ?? "", amount: transaction.amount }),
    [transaction.valAddress, transaction.amount],
  );
  const amount = transaction.amount;
  const crypto = cryptoFactory(account.currency.id);
  const notEnoughFundsError = status.errors?.amount?.name === "NotEnoughBalance";

  return (
    <Box flow={1}>
      <TrackPage
        category="Undelegation Flow"
        name="Step 1"
        flow="stake"
        action="undelegation"
        currency={account.currency.id}
      />
      {error && <ErrorBanner error={error} />}
      <Box horizontal justifyContent="center" mb={2}>
        <Text ff="Inter|Medium" fontSize={4}>
          <Trans
            i18nKey={"cosmos.undelegation.flow.steps.amount.subtitle"}
            values={{
              numberOfDays: crypto.unbondingPeriod,
            }}
          >
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
        label={<Trans i18nKey={"cosmos.undelegation.flow.steps.amount.fields.amount"} />}
      />
      <Box mb={1} />
      {notEnoughFundsError ? <NotEnoughFundsToUnstake account={account} onClose={onClose} /> : null}
      <Alert type="primary" mt={2}>
        <Trans
          i18nKey={"cosmos.undelegation.flow.steps.amount.warning"}
          values={{
            numberOfDays: crypto.unbondingPeriod,
          }}
        >
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
  invariant(account && transaction, "account and transaction required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const requestedDelegation = resolveTransactionValidators(transaction)[0];
  const currentDelegation = account.stakingResources.delegations.find(
    delegation => delegation.validatorAddress === requestedDelegation?.address,
  );
  const hasValidAmount =
    !!requestedDelegation &&
    !!currentDelegation &&
    requestedDelegation.amount.gt(0) &&
    requestedDelegation.amount.lte(currentDelegation.amount);
  const canNext = !bridgePending && !hasErrors && hasValidAmount;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("device")}>
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}

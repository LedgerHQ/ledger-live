import React, { Fragment, useCallback } from "react";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import invariant from "invariant";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ModeSelectorField from "../fields/ModeSelectorField";
import Text from "~/renderer/components/Text";
import DelegationSelectorField from "../fields/DelegationSelectorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { Transaction, AccountBridge } from "@ledgerhq/types-live";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { StepProps } from "../types";
const StepClaimRewards = (props: StepProps) => {
  const {
    account,
    parentAccount,
    onUpdateTransaction,
    transaction,
    warning,
    error,
    t,
    validators,
    delegations,
    contract,
  } = props;
  invariant(account && account.elrondResources && transaction, "account and transaction required");
  const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
  const updateClaimRewards = useCallback(
    (newTransaction: Transaction) => {
      onUpdateTransaction(
        (transaction: Transaction): AccountBridge<Transaction> =>
          bridge.updateTransaction(transaction, newTransaction),
      );
    },
    [bridge, onUpdateTransaction],
  );
  const onChangeMode = useCallback(
    (mode: string) => {
      updateClaimRewards({
        ...transaction,
        mode,
      });
    },
    [updateClaimRewards, transaction],
  );
  const onDelegationChange = useCallback(
    (validator: ElrondProvider) => {
      updateClaimRewards({
        ...transaction,
        recipient: validator.delegation.contract,
        amount: BigNumber(validator.delegation.claimableRewards),
      });
    },
    [updateClaimRewards, transaction],
  );
  const key = transaction.mode === "claimRewards" ? "claimInfo" : "compoundInfo";
  return (
    <Box flow={1}>
      <TrackPage category="ClaimRewards Flow" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning={true} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <ModeSelectorField mode={transaction.mode} onChange={onChangeMode} />

      {transaction.amount.gt(0) && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey={`elrond.claimRewards.flow.steps.claimRewards.${key}`}
            values={{
              amount: `${denominate({
                input: String(transaction.amount),
                decimals: 4,
              })} ${getAccountUnit(account).code}`,
            }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        contract={contract}
        validators={validators}
        delegations={delegations}
        bridge={bridge}
        onUpdateTransaction={onUpdateTransaction}
        onChange={onDelegationChange}
        transaction={transaction}
        t={t}
      />
    </Box>
  );
};
const StepClaimRewardsFooter = (props: StepProps) => {
  const { transitionTo, account, parentAccount, onClose, status, bridgePending } = props;
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <Fragment>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />

      <Box horizontal={true}>
        <Button mr={1} secondary={true} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>

        <Button disabled={!canNext} primary={true} onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Fragment>
  );
};
export { StepClaimRewardsFooter };
export default StepClaimRewards;

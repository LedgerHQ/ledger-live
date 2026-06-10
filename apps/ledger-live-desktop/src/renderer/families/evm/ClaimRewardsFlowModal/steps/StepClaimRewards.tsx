import type {
  GenericTransaction,
  GenericTransactionMode,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { hasCompound } from "@ledgerhq/live-common/families/evm/staking/logic";
import {
  isStakingAccount,
  StakingDelegation,
} from "@ledgerhq/live-common/families/evm/staking/types";
import invariant from "invariant";
import { useSelector } from "LLD/hooks/redux";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Text from "~/renderer/components/Text";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { localeSelector } from "~/renderer/reducers/settings";
import DelegationSelectorField from "../fields/DelegationSelectorField";
import ModeSelectorField from "../fields/ModeSelectorField";
import { StepProps } from "../types";
import { findDelegationByValidator } from "../utils";

export default function StepClaimRewards({
  account,
  error,
  onUpdateTransaction,
  parentAccount,
  t,
  transaction,
  warning,
}: StepProps) {
  invariant(
    account && isStakingAccount(account) && account.stakingResources.delegations.length > 0,
    "account must have delegation",
  );
  invariant(
    transaction && transaction.valAddress,
    "transaction and validator address set required",
  );

  const selectedValidator = findDelegationByValidator(
    transaction.valAddress,
    account.stakingResources.delegations,
  );
  invariant(selectedValidator, "Validator must exist in account delegations");

  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const amount = formatCurrencyUnit(unit, selectedValidator.pendingRewards, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    locale,
  });
  const bridge = useAccountBridge<GenericTransaction>(account, parentAccount);

  const compoundSupported = hasCompound(account.currency.id);

  const onDelegationChange = useCallback(
    (delegation: StakingDelegation | null | undefined) => {
      if (!delegation) {
        return;
      }

      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          ...transaction,
          valAddress: delegation.validatorAddress,
          valId: delegation.validatorId,
        }),
      );
    },
    [bridge, onUpdateTransaction, transaction],
  );

  const onModeChange = useCallback(
    (mode: string) => {
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, { mode: mode as GenericTransactionMode }),
      );
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackPage
        category="ClaimRewards Flow"
        name="Step 1"
        flow="stake"
        action="claim_rewards"
        currency={account.currency.id}
      />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {compoundSupported ? (
        <ModeSelectorField mode={transaction.mode} onChange={onModeChange} />
      ) : null}
      {amount && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey={`cosmos.claimRewards.flow.steps.claimRewards.${
              transaction.mode === "compoundReward" ? "compoundInfo" : "claimInfo"
            }`}
            values={{
              amount,
            }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        transaction={transaction}
        account={account}
        t={t}
        onChange={onDelegationChange}
      />
    </Box>
  );
}

export function StepClaimRewardsFooter({
  account,
  bridgePending,
  onClose,
  parentAccount,
  status,
  transitionTo,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length > 0;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          disabled={bridgePending || hasErrors}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

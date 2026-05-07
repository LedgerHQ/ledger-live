import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import {
  mapDelegations,
  getUnbondingPeriodDays,
  hasUnbondingPeriod,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { ValidatorField, AmountField } from "../fields";
import { StepProps } from "../types";

export default function StepAmount({
  account,
  parentAccount,
  transaction,
  onUpdateTransaction,
  status,
  error,
  validatorAddress,
}: Readonly<StepProps>) {
  invariant(account && transaction, "account and transaction required");
  const unit = useAccountUnit(account);

  const bridge = getAccountBridge(account, parentAccount) as AccountBridge<GenericTransaction>;

  // Rely on the authoritative mapping (same as the delegation table) to keep the validator
  // metadata (name, icon) consistent across the whole flow.
  const mappedDelegation = useMemo(() => {
    const [mapped] = mapDelegations(
      account.stakingResources.delegations.filter(d => d.validatorAddress === validatorAddress),
      account.stakingResources.validators ?? [],
      unit,
    );
    return mapped;
  }, [
    account.stakingResources.delegations,
    account.stakingResources.validators,
    unit,
    validatorAddress,
  ]);

  const delegatedAmount = mappedDelegation?.amount ?? new BigNumber(0);

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount }));
    },
    [onUpdateTransaction, bridge],
  );

  const unbondingDays = getUnbondingPeriodDays(account.currency.id);
  const showLockup = hasUnbondingPeriod(account.currency.id);

  // Surface any bridge validation error that is NOT shown inside the AmountField
  // (e.g. errors.fees when the account has no free balance for gas).
  // Must be called before the conditional return to respect rules of hooks.
  const hiddenError = useMemo(() => {
    const { amount: _a, unbonding: _u, ...rest } = status.errors ?? {};
    return Object.values(rest)[0] ?? null;
  }, [status.errors]);

  if (!mappedDelegation) {
    return (
      <Box flow={1}>
        <ErrorBanner error={new Error("No delegation found for the requested validator")} />
      </Box>
    );
  }

  return (
    <Box flow={1}>
      <TrackPage
        category="Undelegation Flow EVM"
        name="Step 1"
        flow="stake"
        action="undelegation"
        currency={account.currency.id}
      />
      {error && <ErrorBanner error={error} />}
      {!error && hiddenError && <ErrorBanner error={hiddenError} />}
      {showLockup && unbondingDays ? (
        <Box horizontal justifyContent="center" mb={2}>
          <Text ff="Inter|Medium" fontSize={4}>
            <Trans
              i18nKey="ethereum.evmStaking.undelegation.flow.steps.amount.subtitle"
              values={{ numberOfDays: unbondingDays }}
            >
              <b></b>
            </Trans>
          </Text>
        </Box>
      ) : null}
      <ValidatorField delegation={mappedDelegation} />
      <AmountField
        amount={transaction.amount ?? new BigNumber(0)}
        delegatedAmount={delegatedAmount}
        account={account}
        status={status}
        onChange={onChangeAmount}
        label={<Trans i18nKey="ethereum.evmStaking.undelegation.flow.steps.amount.fields.amount" />}
      />
      <Box mb={1} />
      <Alert type="primary" mt={2}>
        {showLockup && unbondingDays ? (
          <Trans
            i18nKey="ethereum.evmStaking.undelegation.flow.steps.amount.warningWithTimelock"
            values={{ numberOfDays: unbondingDays }}
          >
            <b></b>
          </Trans>
        ) : (
          // Instant withdrawals — no unbonding period. We only surface the auto-claim notice.
          <Trans i18nKey="ethereum.evmStaking.undelegation.flow.steps.amount.warningInstant">
            <b></b>
          </Trans>
        )}
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
}: Readonly<StepProps>) {
  const { t } = useTranslation();
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  // Pre-populated from the delegation row — amount must be positive to proceed.
  // bridgePending is handled via isLoading on the button (spinner), not by disabling outright,
  // so the user gets visual feedback instead of a silently-grayed button.
  const hasAmount = !!transaction && new BigNumber(transaction.amount ?? 0).gt(0);
  const canNext = !hasErrors && hasAmount;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          isLoading={bridgePending}
          disabled={!canNext}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}

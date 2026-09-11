import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ErrorDisplay from "../../shared/components/ErrorDisplay";
import ValidatorRow from "../../shared/components/ValidatorRow";
import { StepProps } from "../types";
import { useStakeValidatorStep } from "../../shared/hooks/useStakeValidatorStep";
import NotEnoughFundsToUnstake from "~/renderer/components/NotEnoughFundsToUnstake";

export default function StepValidator({
  account,
  transaction,
  status,
  error,
  t: _t,
  onClose,
}: StepProps) {
  const { unit, validator } = useStakeValidatorStep(account, transaction, "undelegate");
  if (validator === undefined) {
    return null;
  }
  const notEnoughFundsError = status.errors?.fee?.name === "NotEnoughBalance";

  return (
    <Box flow={1}>
      <TrackPage
        category="Solana Delegation Deactivate"
        name="Step Validator"
        flow="stake"
        action="deactivate"
        currency="sol"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorRow
        disableHover
        active
        currency={account.currency}
        validator={validator}
        unit={unit}
      />
      {status.errors.fee && !notEnoughFundsError && <ErrorDisplay error={status.errors.fee} />}
      {notEnoughFundsError ? <NotEnoughFundsToUnstake account={account} onClose={onClose} /> : null}
    </Box>
  );
}
export function StepValidatorFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length > 0;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="delegate-continue-button"
          disabled={!canNext}
          isLoading={bridgePending}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

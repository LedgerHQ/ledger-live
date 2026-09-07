import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ErrorDisplay from "../../shared/components/ErrorDisplay";
import { StepProps } from "../types";
import ValidatorRow from "../../shared/components/ValidatorRow";
import { useStakeValidatorStep } from "../../shared/hooks/useStakeValidatorStep";

export default function StepValidator({ account, transaction, status, error }: StepProps) {
  const { unit, validator } = useStakeValidatorStep(account, transaction, "stake.delegate");
  if (validator === undefined) {
    return null;
  }
  return (
    <Box flow={1}>
      <TrackPage
        category="Solana Delegation Reactivate"
        name="Step Validator"
        flow="stake"
        action="reactivate"
        currency="sol"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorRow
        disableHover
        active
        currency={account.currency}
        key={validator.voteAccount}
        validator={validator}
        unit={unit}
      ></ValidatorRow>
      {status.errors.fee && <ErrorDisplay error={status.errors.fee} />}
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

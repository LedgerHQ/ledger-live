import noop from "lodash/noop";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getClaimableStakingBalance } from "@ledgerhq/live-common/families/aleo/utils";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { StepProps } from "../types";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "neutral.c80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;

const StepSummary = ({ account, parentAccount, error, status }: StepProps) => {
  const aleoAccount = (account ?? undefined) as AleoAccount | undefined;
  const unit = useMaybeAccountUnit(aleoAccount);
  // The chain releases whatever has finished unbonding, so there is no amount to pick — this is
  // shown read-only purely so the user can check it against what they expect.
  const claimable = aleoAccount ? getClaimableStakingBalance(aleoAccount) : null;

  if (!status) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  return (
    <Box flow={4}>
      <TrackPage
        category="Delegation Flow"
        name="Step Summary"
        flow="claim"
        action="claiming"
        currency="aleo"
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {!status.errors.amount && status.errors.fees ? (
        <ErrorBanner error={status.errors.fees} />
      ) : null}
      <Alert type="primary" small data-testid="claim-info-banner">
        <Trans i18nKey="aleo.claim.flow.steps.summary.info" />
      </Alert>
      {claimable && unit && claimable.gt(0) ? (
        <Box flow={1}>
          <Label>
            <Trans i18nKey="aleo.claim.flow.steps.summary.claimableAmountLabel" />
          </Label>
          <InputCurrency
            readOnly
            defaultUnit={unit}
            value={claimable}
            onChange={noop}
            renderRight={<InputRight>{unit.code}</InputRight>}
            containerProps={{ grow: true, style: { pointerEvents: "none" } }}
            data-testid="claim-summary-amount"
          />
        </Box>
      ) : null}
    </Box>
  );
};

export function StepSummaryFooter({
  account,
  parentAccount,
  status,
  bridgePending,
  transitionTo,
}: StepProps) {
  if (!account) return null;
  const canNext = !bridgePending && Object.keys(status.errors).length === 0;

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Button
        id="claim-summary-continue-button"
        isLoading={bridgePending}
        primary
        disabled={!canNext}
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
}

export default StepSummary;

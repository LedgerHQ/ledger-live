import noop from "lodash/noop";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getClaimableStakingBalance } from "@ledgerhq/live-common/families/aleo/utils";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "neutral.c80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;

export default function StepSummary({ error, account, status }: StepProps) {
  const aleoAccount = (account ?? undefined) as AleoAccount | undefined;
  const unit = useMaybeAccountUnit(aleoAccount);
  const claimable = aleoAccount ? getClaimableStakingBalance(aleoAccount) : null;

  return (
    <Box flow={3}>
      <TrackPage category="Claim Flow" name="Step Summary" currency="aleo" type="modal" />
      {error ? <ErrorBanner error={error} /> : null}
      {!status.errors.amount && status.errors.fees ? (
        <ErrorBanner error={status.errors.fees} />
      ) : null}
      <Alert type="primary" small>
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
}

export function StepSummaryFooter({ transitionTo, bridgePending, status, onClose }: StepProps) {
  const canNext = !bridgePending && Object.keys(status.errors).length === 0;
  return (
    <Box horizontal>
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="claim-summary-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

import React from "react";
import { Trans } from "react-i18next";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getClaimableStakingBalance } from "@ledgerhq/live-common/families/aleo/utils";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";

export default function StepSummary({ error, account }: StepProps) {
  const aleoAccount = (account ?? undefined) as AleoAccount | undefined;
  const unit = useMaybeAccountUnit(aleoAccount);
  const claimable = aleoAccount ? getClaimableStakingBalance(aleoAccount) : null;

  return (
    <Box flow={3}>
      <TrackPage category="Claim Flow" name="Step Summary" currency="aleo" type="modal" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" small>
        <Trans i18nKey="aleo.claim.flow.steps.summary.info" />
      </Alert>
      {claimable && unit && claimable.gt(0) ? (
        <Box horizontal justifyContent="space-between" alignItems="center">
          <Label>
            <Trans i18nKey="aleo.claim.flow.steps.summary.claimableAmountLabel" />
          </Label>
          <Text
            color="neutral.c100"
            ff="Inter|SemiBold"
            fontSize={4}
            data-testid="claim-summary-amount"
          >
            {formatCurrencyUnit(unit, claimable, { showCode: true, disableRounding: true })}
          </Text>
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

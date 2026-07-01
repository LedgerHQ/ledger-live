import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";

export default function StepSummary({ error }: StepProps) {
  // TODO(LIVE-29195): show claimable amount when staking balances land.
  return (
    <Box flow={3}>
      <TrackPage category="Claim Flow" name="Step Summary" currency="aleo" type="modal" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" small>
        <Trans i18nKey="aleo.claim.flow.steps.summary.info" />
      </Alert>
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

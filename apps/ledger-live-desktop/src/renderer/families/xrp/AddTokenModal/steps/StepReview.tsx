import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { TrackScreen } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import type { StepProps } from "../types";

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box horizontal justifyContent="space-between" alignItems="center" mb={3}>
      <Text ff="Inter|Medium" fontSize={4} color="neutral.c70">
        {label}
      </Text>
      <Box ml={4} style={{ minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export default function StepReview({ transaction, status, token, error, isRippling }: StepProps) {
  invariant(transaction && token, "xrp: transaction and token required");

  const errors = Object.values(status.errors);
  const warnings = Object.values(status.warnings);

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Review" />
      {error ? <ErrorBanner error={error} /> : null}
      {errors.map(statusError => (
        <ErrorBanner key={statusError.name} error={statusError} />
      ))}
      {warnings.map(warning => (
        <ErrorBanner key={warning.name} error={warning} warning />
      ))}
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.token" />}>
        <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
          {`${token.name} (${token.ticker})`}
        </Text>
      </Row>
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.issuer" />}>
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c100" title={token.contractAddress}>
          {token.contractAddress}
        </Text>
      </Row>
      {token.tokenType === "iou" ? (
        <>
          <Row label={<Trans i18nKey="xrp.addToken.steps.settings.limit" />}>
            <FormattedVal
              val={transaction.amount}
              unit={token.units[0]}
              showCode
              alwaysShowValue
              color="neutral.c100"
              fontSize={4}
            />
          </Row>
          <Row label={<Trans i18nKey="xrp.rippling.label" />}>
            <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
              <Trans i18nKey={isRippling ? "xrp.rippling.on" : "xrp.rippling.off"} />
            </Text>
          </Row>
        </>
      ) : null}
    </Box>
  );
}

export function StepReviewFooter({
  transitionTo,
  account,
  parentAccount,
  status,
  bridgePending,
}: StepProps) {
  invariant(account, "xrp: account required");
  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <>
      <AccountFooter account={account} parentAccount={parentAccount} status={status} />
      <Button
        primary
        disabled={hasErrors || bridgePending}
        isLoading={bridgePending}
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
}

import React from "react";
import styled from "styled-components";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import RetryButton from "~/renderer/components/RetryButton";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { StepProps } from "../types";
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;
function StepConfirmation({ account, error }: StepProps) {
  const currency = account && getAccountCurrency(account);
  const currencyName = currency?.name ?? "";
  if (error) {
    return (
      <Container>
        <TrackPage
          category="Sign Raw Transaction Flow"
          name="Step Confirmation Error"
          currencyName={currencyName}
        />
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}
export function StepConfirmationFooter({ transitionTo, onRetry, error }: StepProps) {
  if (!error) return null;

  return (
    <RetryButton
      ml={2}
      primary
      onClick={() => {
        onRetry();
        transitionTo("summary");
      }}
    />
  );
}
export default StepConfirmation;

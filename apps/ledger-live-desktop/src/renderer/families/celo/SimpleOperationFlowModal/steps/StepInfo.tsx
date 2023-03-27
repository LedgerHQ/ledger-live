import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { StepProps } from "../types";
export const StepInfoFooter = ({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) => {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          disabled={!canNext}
          isLoading={bridgePending}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" isLoading={bridgePending} disabled={!canNext} />
        </Button>
      </Box>
    </>
  );
};
const StepInfo = ({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  warning,
  error,
  t,
  mode,
}: StepProps) => {
  invariant(account && account.celoResources && transaction, "account and transaction required");
  const description = t(`celo.simpleOperation.modes.${mode}.description`);
  return (
    <Box flow={1}>
      <TrackPage category="Celo SimpleOperation" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {description && (
        <Box px={5} py={2}>
          <Text textAlign="center" ff="Inter|Medium" fontSize={4}>
            <Trans i18nKey={`celo.simpleOperation.modes.${mode}.description`} />
          </Text>
        </Box>
      )}

      <Alert type="primary">
        <Trans i18nKey={`celo.simpleOperation.modes.${mode}.info`} />
      </Alert>
    </Box>
  );
};
export default StepInfo;

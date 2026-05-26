import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FormattedVal from "~/renderer/components/FormattedVal";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import TrackPage from "~/renderer/analytics/TrackPage";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { StepProps } from "../types";

const StepAmount = ({
  t,
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  error,
  onChangeTransaction,
}: StepProps) => {
  invariant(account && transaction?.family === "tezos", "tezos account and transaction required");

  const unit = useAccountUnit(account);
  const { stakedBalance } = useTezosStakingInfo(account);

  return (
    <Box flow={4}>
      <TrackPage
        category="Unstake Flow"
        name="Step Amount"
        flow="stake"
        action="unstake"
        currency="xtz"
      />
      <CurrencyDownStatusAlert currencies={[account.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary">
        <Trans i18nKey="tezos.unstake.flow.steps.amount.unbondingNotice" />
      </Alert>
      <Box horizontal justifyContent="space-between" alignItems="center">
        <Label>
          <Trans i18nKey="tezos.unstake.flow.steps.amount.availableLabel" />
        </Label>
        <Text color="neutral.c80" ff="Inter|Medium" fontSize={13} data-testid="unstake-available">
          <FormattedVal val={stakedBalance} unit={unit} showCode alwaysShowValue disableRounding />
        </Text>
      </Box>
      <AmountField
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        onChangeTransaction={onChangeTransaction}
        status={status}
        bridgePending={bridgePending}
        t={t}
        withUseMaxLabel
      />
    </Box>
  );
};

export const StepAmountFooter = ({
  transitionTo,
  account,
  parentAccount,
  status,
  bridgePending,
  onClose,
}: StepProps) => {
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
          primary
          isLoading={bridgePending}
          disabled={!canNext}
          onClick={() => transitionTo("device")}
          data-testid="tezos-unstake-amount-continue-button"
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
};

export default StepAmount;

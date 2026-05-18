import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { Transaction } from "@ledgerhq/live-common/families/tezos/types";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FormattedVal from "~/renderer/components/FormattedVal";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { StepProps } from "../types";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "neutral.c70",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

const MaxButton = styled.button`
  background: none;
  border: 0;
  color: ${p => p.theme.colors.wallet};
  cursor: pointer;
  font-family: Inter, sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 0 0 0 6px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StepAmount = ({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  error,
  onChangeTransaction,
}: StepProps) => {
  invariant(account && transaction, "account and transaction required");

  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const unit = useAccountUnit(account);
  const { stakedBalance } = useTezosStakingInfo(account);

  const onChange = useCallback(
    (value: BigNumber) => {
      onChangeTransaction(bridge.updateTransaction(transaction, { amount: value }));
    },
    [bridge, transaction, onChangeTransaction],
  );

  const onMax = useCallback(() => {
    onChangeTransaction(bridge.updateTransaction(transaction, { amount: stakedBalance }));
  }, [bridge, transaction, onChangeTransaction, stakedBalance]);

  const { amount, errors, warnings } = status;
  const amountError = amount.eq(0) ? null : errors.amount;
  const maxDisabled = bridgePending || stakedBalance.lte(0);

  return (
    <Box flow={1}>
      <TrackPage
        category="Unstake Flow"
        name="Step Amount"
        flow="stake"
        action="unstake"
        currency="xtz"
      />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" mb={4}>
        <Trans i18nKey="tezos.unstake.flow.steps.amount.unbondingNotice" />
      </Alert>
      <Box horizontal justifyContent="space-between" alignItems="center" mb={1}>
        <Label>
          <Trans i18nKey="tezos.unstake.flow.steps.amount.amountLabel" />
        </Label>
        <Box horizontal alignItems="center">
          <Text color="neutral.c60" ff="Inter|Medium" fontSize={13}>
            <Trans i18nKey="tezos.unstake.flow.steps.amount.availableLabel" />
            {": "}
          </Text>
          <Text color="neutral.c60" ff="Inter|Medium" fontSize={13}>
            <FormattedVal
              val={stakedBalance}
              unit={unit}
              showCode
              alwaysShowValue
              disableRounding
            />
          </Text>
          <MaxButton type="button" onClick={onMax} disabled={maxDisabled}>
            <Trans i18nKey="tezos.unstake.flow.steps.amount.maxLabel" />
          </MaxButton>
        </Box>
      </Box>
      <InputCurrency
        autoFocus
        error={amountError}
        warning={warnings.amount}
        containerProps={{ grow: true }}
        defaultUnit={unit}
        value={amount}
        onChange={onChange}
        renderRight={<InputRight>{unit.code}</InputRight>}
      />
    </Box>
  );
};

export const StepAmountFooter = ({ transitionTo, status, bridgePending, onClose }: StepProps) => {
  const { errors, amount } = status;
  const hasErrors = Object.keys(errors).length > 0;
  const canNext = !bridgePending && !hasErrors && amount.gt(0);
  return (
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
  );
};

export default StepAmount;

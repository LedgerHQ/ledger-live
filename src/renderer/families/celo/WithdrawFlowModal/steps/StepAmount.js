// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import styled from "styled-components";

import { Trans } from "react-i18next";
import moment from "moment";

import type { StepProps } from "../types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CheckBox from "~/renderer/components/CheckBox";
import Clock from "~/renderer/icons/Clock";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";

import ErrorBanner from "~/renderer/components/ErrorBanner";

const Description = styled(Text).attrs(({ isPill }) => ({
  ff: isPill ? "Inter|SemiBold" : "Inter|Regular",
  fontSize: isPill ? 2 : 3,
  color: "palette.text.shade60",
}))`
  ${p =>
    p.isPill
      ? `
    text-transform: uppercase;
  `
      : ""}
`;

const SelectResource = styled(Box).attrs(() => ({
  horizontal: true,
  p: 3,
  mt: 2,
  alignItems: "center",
  justifyContent: "space-between",
}))`
  height: 58px;
  border: 1px solid ${p => p.theme.colors.palette.text.shade20};
  border-radius: 4px;
  ${p =>
    p.disabled
      ? `
          opacity: 0.7;
          cursor: auto;
        `
      : ``}
`;

const TimerWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|Medium",
  fontSize: 3,
  color: "palette.text.shade60",
  bg: "palette.text.shade10",
  borderRadius: 4,
  p: 1,
  mr: 4,
}))`
  align-self: center;

  ${Description} {
    margin-left: 5px;
  }
`;

export default function StepAmount({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  status,
  error,
  bridgePending,
  t,
}: StepProps) {
  invariant(
    account && transaction && account.celoResources && account.celoResources.pendingWithdrawals,
    "account with pending withdrawals and transaction required",
  );

  const bridge = getAccountBridge(account, parentAccount);

  const onChange = useCallback(
    (index: number) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          index,
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  const { pendingWithdrawals } = account.celoResources;

  if ((transaction.index === null || transaction.index === undefined) && pendingWithdrawals[0])
    onChange(pendingWithdrawals[0].index);

  return (
    <Box flow={1}>
      <TrackPage category="Withdraw Flow" name="Step 1" />
      {error ? <ErrorBanner error={error} /> : null}
      <Box vertical>
        {pendingWithdrawals.map(({ value, time, index }) => {
          const withdrawalTime = new Date(time.toNumber() * 1000);
          const disabled = withdrawalTime > new Date();
          return (
            <SelectResource disabled={disabled} key={index}>
              <Text ff="Inter|SemiBold"></Text>
              <Box horizontal alignItems="center">
                {disabled && (
                  <TimerWrapper>
                    <Clock size={12} />
                    <Description isPill>{moment(withdrawalTime).fromNow()}</Description>
                  </TimerWrapper>
                )}
                <FormattedVal
                  val={value}
                  unit={account.unit}
                  style={{ textAlign: "right", width: "auto", marginRight: 10 }}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
                <CheckBox
                  isRadio
                  disabled={disabled}
                  isChecked={transaction.index === index}
                  onChange={() => onChange(index)}
                />
              </Box>
            </SelectResource>
          );
        })}
      </Box>
    </Box>
  );
}

export function StepAmountFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) {
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
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import moment from "moment";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CheckBox from "~/renderer/components/CheckBox";
import Clock from "~/renderer/icons/Clock";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import * as S from "./StepAmount.styles";
import { StepProps } from "../types";
export const StepAmountFooter = ({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
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
const StepAmount = ({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  status,
  error,
  bridgePending,
  t,
}: StepProps) => {
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
      <TrackPage category="Celo Withdraw" name="Step 1" />
      {error &&
      !(error instanceof UserRefusedOnDevice || error instanceof TransactionRefusedOnDevice) ? (
        <ErrorBanner error={error} />
      ) : null}
      <Box vertical>
        {pendingWithdrawals.map(({ value, time, index }) => {
          const withdrawalTime = new Date(time.toNumber() * 1000);
          const disabled = withdrawalTime > new Date();
          return (
            <S.SelectResource disabled={disabled} key={index}>
              <Text ff="Inter|SemiBold"></Text>
              <Box horizontal alignItems="center">
                {disabled && (
                  <S.TimerWrapper>
                    <Clock size={12} />
                    <S.Description isPill>{moment(withdrawalTime).fromNow()}</S.Description>
                  </S.TimerWrapper>
                )}
                <FormattedVal
                  val={value}
                  unit={account.unit}
                  style={{
                    textAlign: "right",
                    width: "auto",
                    marginRight: 10,
                  }}
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
            </S.SelectResource>
          );
        })}
      </Box>
    </Box>
  );
};
export default StepAmount;

import React, { Fragment, useCallback } from "react";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import DelegationSelectorField from "../fields/DelegationSelectorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/elrond/types";
import { StepProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const StepWithdraw = (props: StepProps) => {
  const {
    account,
    onUpdateTransaction,
    transaction,
    warning,
    error,
    t,
    unbondings,
    contract,
    amount,
    name,
  } = props;
  const unit = useAccountUnit(account);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const onDelegationChange = useCallback(
    // @ts-expect-error another TS puzzle for another day
    validator => {
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          ...transaction,
          recipient: validator.contract,
          amount: BigNumber(validator.amount),
        }),
      );
    },
    [bridge, onUpdateTransaction],
  );
  return (
    <Box flow={1}>
      <TrackPage
        category="ClaimRewards Flow"
        name="Step 1"
        flow="stake"
        action="withdraw"
        currency="MultiversX"
      />
      {warning && !error ? <ErrorBanner error={warning} warning={true} /> : null}
      {error ? <ErrorBanner error={error} /> : null}

      {transaction?.amount.gt(0) && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey="elrond.withdraw.flow.steps.withdraw.description"
            values={{
              validator: name,
              amount: `${denominate({
                input: String(transaction.amount),
                decimals: 4,
              })} ${unit.code}`,
            }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        contract={contract}
        unbondings={unbondings}
        t={t}
        amount={amount}
        bridge={bridge}
        transaction={transaction}
        onUpdateTransaction={onUpdateTransaction}
        onChange={onDelegationChange}
      />
    </Box>
  );
};
const StepWithdrawFooter = (props: StepProps) => {
  const { transitionTo, account, onClose, status, bridgePending } = props;
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <Fragment>
      <AccountFooter status={status} account={account} />

      <Box horizontal={true}>
        <Button mr={1} secondary={true} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>

        <Button disabled={!canNext} primary={true} onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Fragment>
  );
};
export { StepWithdrawFooter };
export default StepWithdraw;

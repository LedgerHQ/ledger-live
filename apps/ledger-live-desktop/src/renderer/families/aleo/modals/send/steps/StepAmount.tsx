import React, { Fragment } from "react";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";

import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import type { StepProps } from "~/renderer/modals/Send/types";
import { closeAllModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import LowGasAlertBuyMore from "~/renderer/components/LowGasAlertBuyMore";
import QuickAmountSelector from "../../../shared/QuickAmountSelector";

const StepAmount = (props: StepProps) => {
  const dispatch = useDispatch();
  const {
    t,
    account,
    parentAccount,
    transaction,
    onChangeTransaction,
    error,
    status,
    bridgePending,
    maybeAmount,
    onResetMaybeAmount,
    updateTransaction,
    currencyName,
    walletConnectProxy,
  } = props;
  invariant(transaction, "transaction required");
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "main account required");

  if (!status) return null;
  const { errors } = status;
  const { gasPrice } = errors;

  return (
    <Box flow={4}>
      <TrackPage
        category="Send Flow"
        name="Step Amount"
        currencyName={currencyName}
        walletConnectSend={walletConnectProxy}
      />
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        <SpendableBanner
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
        />

        <AmountField
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          bridgePending={bridgePending}
          walletConnectProxy={walletConnectProxy}
          t={t}
          initValue={maybeAmount}
          resetInitValue={onResetMaybeAmount}
        />

        <QuickAmountSelector account={mainAccount} onClick={strategy => console.log(strategy)} />

        <SendAmountFields
          account={mainAccount}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          onChange={onChangeTransaction}
          bridgePending={bridgePending}
          updateTransaction={updateTransaction}
        />
        <LowGasAlertBuyMore
          account={mainAccount}
          handleRequestClose={() => dispatch(closeAllModal())}
          gasPriceError={gasPrice}
          trackingSource={"send flow"}
        />
      </Fragment>
    </Box>
  );
};

export default StepAmount;

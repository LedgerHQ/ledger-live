// @flow

import type { StepProps } from "~/renderer/modals/Send/types";

import React, { Fragment } from "react";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";

import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import MemoField from "~/renderer/families/hedera/MemoField";

import AmountField from "~/renderer/modals/Send/fields/AmountField";

const StepAmount = ({
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
  currencyName,
  walletConnectProxy,
}: StepProps) => {
  if (!status) return null;

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  return (
    <Box flow={4}>
      <TrackPage
        category="Send Flow"
        name="Step Amount"
        currencyName={currencyName}
        walletConnectSend={walletConnectProxy}
      />

      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}

      {/* error display  */}
      {error ? <ErrorBanner error={error} /> : null}

      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {account && transaction ? (
            <SpendableBanner
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
            />
          ) : null}

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

          <MemoField
            status={status}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            onChangeTransaction={onChangeTransaction}
            t={t}
          />
        </Fragment>
      )}
    </Box>
  );
};

export default StepAmount;

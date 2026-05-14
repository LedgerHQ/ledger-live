import BigNumber from "bignumber.js";
import React, { Fragment, useCallback, useState } from "react";
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
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { getAleoCurrencyConfig } from "../../../shared/utils";
import QuickAmountSelector from "../../../shared/QuickAmountSelector";
import InfoBanner from "../../../shared/InfoBanner";
import { isAleoAccount, isAleoTransaction } from "./utils";

const StepAmount = (props: StepProps) => {
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
  const [amountFieldKey, setAmountFieldKey] = useState(0);

  invariant(transaction, "transaction required");
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "main account required");
  const config = getAleoCurrencyConfig(mainAccount.currency);

  const currencyConfig = getAleoCurrencyConfig(mainAccount.currency);
  const isAutoPickingStrategy =
    currencyConfig?.recordPickingStrategy === "auto" &&
    isAleoTransaction(transaction) &&
    isPrivateTransaction(transaction);

  const isQuickSelectApplied = amountFieldKey > 0;
  const handleQuickSelect = useCallback(() => {
    setAmountFieldKey(k => k + 1);
  }, []);

  if (!status) return null;

  const unit = mainAccount.currency.units[0];
  const unspentRecords = [
    ...((mainAccount as AleoAccount).aleoResources?.unspentPrivateRecords ?? [])
      .filter(r => new BigNumber(r.microcredits).isGreaterThan(0))
      .sort((a, b) => new BigNumber(b.microcredits).comparedTo(new BigNumber(a.microcredits))),
  ];

  const topRecordsSum = unspentRecords.slice(0, 14).reduce((acc, curr) => {
    return acc.plus(Number(curr.microcredits));
  }, new BigNumber(0));

  return (
    <Box flow={4} data-testid="aleo-step-amount">
      <TrackPage
        category="Send Flow"
        name="Step Amount"
        currencyName={currencyName}
        walletConnectSend={walletConnectProxy}
      />
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        {isAutoPickingStrategy ? (
          <InfoBanner />
        ) : (
          <SpendableBanner
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
          />
        )}

        <AmountField
          key={amountFieldKey}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          bridgePending={bridgePending}
          walletConnectProxy={walletConnectProxy}
          t={t}
          initValue={isQuickSelectApplied ? transaction.amount : maybeAmount}
          resetInitValue={isQuickSelectApplied ? undefined : onResetMaybeAmount}
        />

        {isAleoAccount(account) && isAutoPickingStrategy && (
          <QuickAmountSelector
            account={account}
            transaction={transaction}
            updateTransaction={updateTransaction}
            onSelect={handleQuickSelect}
          />
        )}

        <SendAmountFields
          account={mainAccount}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          onChange={onChangeTransaction}
          bridgePending={bridgePending}
          updateTransaction={updateTransaction}
        />
        {config?.recordPickingStrategy === "auto" &&
          transaction.family === "aleo" &&
          isPrivateTransaction(transaction) && (
            <div
              className="flex flex-col gap-16"
              style={{ fontSize: "14px", wordBreak: "break-word" }}
            >
              <div>
                <p>Sum of top 14 records</p>
                <span>
                  {formatCurrencyUnit(unit, topRecordsSum, {
                    showCode: true,
                    showAllDigits: true,
                  })}
                </span>
              </div>
              <div>
                <p>Unspent records ({unspentRecords.length})</p>
                <div style={{ maxHeight: "100px", overflowY: "auto" }}>
                  <ul>
                    {unspentRecords.map(r => {
                      return (
                        <li key={r.commitment}>
                          -{" "}
                          {formatCurrencyUnit(unit, new BigNumber(r.microcredits), {
                            showCode: true,
                            showAllDigits: true,
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div>
                <p>Selected records ({transaction.properties.amountRecordCommitments.length})</p>
                <span>
                  {JSON.stringify(
                    transaction.properties.amountRecordCommitments.map(c => {
                      const recordDetails = unspentRecords.find(r => r.commitment === c);
                      if (!recordDetails) return "-";
                      return formatCurrencyUnit(unit, new BigNumber(recordDetails.microcredits), {
                        showCode: true,
                      });
                    }),
                  )}
                </span>
              </div>
            </div>
          )}
      </Fragment>
    </Box>
  );
};

export default StepAmount;

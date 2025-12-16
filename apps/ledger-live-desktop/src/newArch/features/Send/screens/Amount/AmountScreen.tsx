/**
 * POC - Amount Screen
 * This is a minimal POC to test the wizard architecture.
 * TO BE REMOVED before merging - will be implemented properly in a separate PR.
 */
import React, { useState, useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { Button, Input } from "@ledgerhq/react-ui";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { SEND_FLOW_STEP } from "../../types";

export function AmountScreen() {
  const { state, navigation, transaction, currentStep, direction } = useSendFlowContext();
  const [amountInput, setAmountInput] = useState("");

  const { account, parentAccount } = state.account;
  const { transaction: tx, status, bridgePending } = state.transaction;

  const currencyUnit = useMemo(() => {
    return state.account.currency?.units[0];
  }, [state.account.currency]);

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmountInput(value);

      if (!account || !tx || !currencyUnit) return;

      const bridge = getAccountBridge(account, parentAccount) as AccountBridge<Transaction>;
      const amount = parseCurrencyUnit(currencyUnit, value || "0");

      transaction.updateTransaction(currentTx => bridge.updateTransaction(currentTx, { amount }));
    },
    [account, parentAccount, tx, transaction, currencyUnit],
  );

  const handleContinue = useCallback(() => {
    navigation.goToNextStep();
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goToPreviousStep();
  }, [navigation]);

  const hasAmountError = Boolean(status.errors.amount);
  const canContinue = amountInput.length > 0 && !bridgePending;

  const spendableBalance = useMemo(
    () =>
      account?.type === "Account" ? account.spendableBalance : account?.balance || new BigNumber(0),
    [account],
  );

  const totalSpent = useMemo(() => status.totalSpent || new BigNumber(0), [status.totalSpent]);

  const exceedsBalance = useMemo(
    () => totalSpent.gt(spendableBalance),
    [totalSpent, spendableBalance],
  );

  const formattedSpendableBalance = useMemo(() => {
    if (!state.account.currency || spendableBalance.isZero()) return "0";
    const mainUnit = state.account.currency.units[0];
    return formatCurrencyUnit(mainUnit, spendableBalance, {
      showCode: true,
      disableRounding: false,
    });
  }, [state.account.currency, spendableBalance]);

  const formattedTotalSpent = useMemo(() => {
    if (!state.account.currency || !totalSpent || totalSpent.isZero()) return "0";
    const mainUnit = state.account.currency.units[0];
    return formatCurrencyUnit(mainUnit, totalSpent, {
      showCode: true,
      disableRounding: false,
    });
  }, [state.account.currency, totalSpent]);

  const formattedEstimatedFees = useMemo(() => {
    if (!state.account.currency || !status.estimatedFees || status.estimatedFees.isZero())
      return "0";
    const mainUnit = state.account.currency.units[0];
    return formatCurrencyUnit(mainUnit, status.estimatedFees, {
      showCode: true,
      disableRounding: false,
    });
  }, [state.account.currency, status.estimatedFees]);

  return (
    <div className="flex flex-col gap-24 px-12">
      <div className="flex flex-col gap-8">
        <h2 className="heading-2">Amount</h2>
        <p className="text-muted body-2">Step: Amount</p>
      </div>

      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-8">
          <label className="body-2-semi-bold">Amount</label>
          <Input
            value={amountInput}
            onChange={handleAmountChange}
            placeholder="0.00"
            error={hasAmountError ? String(status.errors.amount?.message) : undefined}
          />
        </div>

        <div className="rounded-lg bg-muted p-12">
          <p className="text-muted body-3">Spendable Balance: {formattedSpendableBalance}</p>
        </div>

        {bridgePending && <p className="text-muted body-3">Calculating fees...</p>}

        {!bridgePending && status.estimatedFees && (
          <div className="flex justify-between">
            <span className="text-muted body-3">Estimated fees:</span>
            <span className="body-3">{formattedEstimatedFees}</span>
          </div>
        )}

        {!bridgePending && status.totalSpent && (
          <div className="flex justify-between">
            <span className="text-muted body-3">Total:</span>
            <span className="body-3-semi-bold">{formattedTotalSpent}</span>
          </div>
        )}

        {exceedsBalance && !hasAmountError && (
          <div className="bg-warning-transparent rounded-lg p-12">
            <p className="text-warning body-3">
              Warning: Total ({formattedTotalSpent}) exceeds spendable balance (
              {formattedSpendableBalance})
            </p>
          </div>
        )}
      </div>

      <div className="mt-24 flex gap-16">
        {navigation.canGoBack() && (
          <Button variant="shade" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button variant="main" disabled={!canContinue} onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <div className="mt-24 rounded-lg bg-muted p-16">
        <div className="flex flex-col gap-8">
          <p className="body-3-semi-bold">Debug Info</p>
          <div className="flex flex-col gap-4">
            <p className="text-muted body-4">
              Step: {currentStep} | Direction: {direction}
            </p>
            <p className="text-muted body-4">
              Amount Input: {amountInput || "(empty)"} | TX Amount: {tx?.amount?.toString() || "0"}
            </p>
            <p className="text-muted body-4">
              Recipient: {tx?.recipient || "(none)"} | Bridge Pending: {String(bridgePending)}
            </p>
            <p className="text-muted body-4">
              Spendable Balance (raw): {spendableBalance.toString()} | Formatted:{" "}
              {formattedSpendableBalance}
            </p>
            <p className="text-muted body-4">
              Total Spent (raw): {totalSpent.toString()} | Formatted: {formattedTotalSpent} |
              Exceeds: {String(exceedsBalance)}
            </p>
            <p className="text-muted body-4">
              Status Errors:{" "}
              {Object.keys(status.errors).length > 0
                ? JSON.stringify(status.errors, null, 2)
                : "none"}
            </p>
            <p className="text-muted body-4">
              Fees (raw): {status.estimatedFees?.toString() || "0"} | Formatted:{" "}
              {formattedEstimatedFees}
            </p>
            <p className="text-muted body-4">
              Account Balance (raw):{" "}
              {account?.type === "Account"
                ? account.balance.toString()
                : account?.balance?.toString() || "0"}
            </p>
            <div className="mt-8 flex gap-8">
              <Button
                variant="shade"
                size="small"
                onClick={() => navigation.goToStep(SEND_FLOW_STEP.RECIPIENT)}
              >
                Go to Recipient
              </Button>
              <Button
                variant="shade"
                size="small"
                onClick={() => navigation.goToStep(SEND_FLOW_STEP.SIGNATURE)}
                disabled={!navigation.canGoForward()}
              >
                Go to Signature
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

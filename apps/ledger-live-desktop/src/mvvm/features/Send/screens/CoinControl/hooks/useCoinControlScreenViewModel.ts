import { bitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useInitialTransactionPreparation } from "../../../hooks/useInitialTransactionPreparation";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useAmountInput } from "./useAmountInput";
import { useBitcoinUtxoDisplayData } from "./useBitcoinUtxoDisplayData";

type StatusWithTxOutputs = TransactionStatus & {
  txOutputs?: ReadonlyArray<{ isChange: boolean; value: BigNumber }>;
};

function hasTxOutputs(status: TransactionStatus): status is StatusWithTxOutputs {
  return "txOutputs" in status;
}

/** Bitcoin status includes txOutputs with change; generic status may not. */
function getChangeToReturn(status: TransactionStatus): BigNumber {
  const outputs = hasTxOutputs(status) ? status.txOutputs ?? [] : [];
  return outputs
    .filter((o): o is { isChange: true; value: BigNumber } => o.isChange)
    .reduce((sum, o) => sum.plus(o.value), new BigNumber(0));
}

type UseCoinControlScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

export function useCoinControlScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
}: UseCoinControlScreenViewModelParams) {
  const { t } = useTranslation();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const locale = useSelector(localeSelector);

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        const bridge = getAccountBridge(account, parentAccount ?? undefined);
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [account, parentAccount, transactionActions],
  );

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;
  const amountComputationPending = bridgePending && shouldPrepare;

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => updateTransactionWithPatch({}),
  });

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
  });

  const hasInsufficientFundsError = useMemo(() => {
    if (!status.errors?.amount) return false;
    const errorName = status.errors.amount.name;
    return (
      errorName === "NotEnoughBalance" ||
      errorName === "NotEnoughBalanceFees" ||
      errorName === "NotEnoughBalanceSwap" ||
      errorName === "NotEnoughBalanceBecauseDestinationNotCreated" ||
      errorName === "NotEnoughBalanceInParentAccount" ||
      errorName === "NotEnoughBalanceToDelegate" ||
      errorName.includes("Insufficient")
    );
  }, [status.errors?.amount]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  // For enabling the CTA, rely on the user-entered transaction amount (no bridge lag)
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) || !hasAmount || amountComputationPending;

  const reviewLabel = hasInsufficientFundsError
    ? t("newSendFlow.getCta", { currency: accountCurrency?.ticker ?? "CRYPTO" })
    : t("newSendFlow.reviewCta");

  const amountInput = useAmountInput({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  const utxoDisplayData = useBitcoinUtxoDisplayData({
    account,
    transaction,
    status,
  });

  const changeToReturnFormatted = useMemo(() => {
    const hasAmount =
      transaction.useAllAmount || (transaction.amount != null && transaction.amount.gt(0));
    if (!hasAmount) return "";
    const changeAmount = getChangeToReturn(status);
    return formatCurrencyUnit(accountUnit, changeAmount, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [accountUnit, locale, status, transaction.amount, transaction.useAllAmount]);

  const onSelectStrategy = useCallback(
    (value: string) => {
      const strategy = parseInt(value, 10);
      if (Number.isNaN(strategy)) return;
      if (!("utxoStrategy" in transaction) || transaction.utxoStrategy == null) return;
      // Bitcoin bridge accepts utxoStrategy patch; base Transaction type doesn't include it
      if (strategy === bitcoinPickingStrategy.CUSTOM) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        updateTransactionWithPatch({
          utxoStrategy: { ...transaction.utxoStrategy, strategy },
        } as Partial<Transaction>);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      updateTransactionWithPatch({
        utxoStrategy: { ...transaction.utxoStrategy, strategy, excludeUTXOs: [] },
      } as Partial<Transaction>);
    },
    [transaction, updateTransactionWithPatch],
  );

  return {
    amountValue: amountInput.amountValue,
    onAmountChange: amountInput.onAmountChange,
    utxoDisplayData,
    changeToReturnFormatted,
    onSelectStrategy,
    reviewLabel,
    reviewShowIcon: !hasInsufficientFundsError,
    reviewDisabled,
    reviewLoading: amountComputationPending,
    ...networkFees,
  };
}

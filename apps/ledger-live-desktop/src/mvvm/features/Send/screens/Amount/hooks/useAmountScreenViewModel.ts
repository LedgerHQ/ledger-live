import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowAmountReviewCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore";
import type { AmountScreenViewModel } from "../types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useAmountInput } from "./useAmountInput";
import { useQuickActions } from "./useQuickActions";
import { useInitialTransactionPreparation } from "../../../hooks/useInitialTransactionPreparation";
import { useAmountScreenMessage } from "./useAmountScreenMessage";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

export function useAmountScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard();

  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    transactionActions,
    labels: {
      reviewCta: t("newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("newSendFlow.getCta", { currency }),
    },
  });

  const {
    mainAccount,
    accountCurrency,
    updateTransactionWithPatch,
    maxAvailable,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled,
    amountComputationPending,
    shouldPrepare,
  } = amountReviewCore;

  const amountInput = useAmountInput({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => updateTransactionWithPatch({}),
  });

  const quickActionsAvailableBalance = useMemo(() => {
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account]);

  const setAmountFromRatio = useCallback(
    (nextAmount: BigNumber) => {
      if (maxAvailable.lte(0)) return;
      amountInput.cancelPendingUpdates();
      const safeAmount = BigNumber.max(nextAmount, 0);
      amountInput.updateBothInputs(safeAmount);
      updateTransactionWithPatch({
        amount: safeAmount,
        useAllAmount: false,
      });
    },
    [amountInput, maxAvailable, updateTransactionWithPatch],
  );

  const handleSelectMax = useCallback(() => {
    amountInput.cancelPendingUpdates();
    updateTransactionWithPatch({
      useAllAmount: true,
      amount: new BigNumber(0),
    });
  }, [updateTransactionWithPatch, amountInput]);

  const quickActions = useQuickActions({
    account,
    parentAccount,
    transaction,
    availableBalance: quickActionsAvailableBalance,
    onSetAmountFromRatio: setAmountFromRatio,
    onSelectMax: handleSelectMax,
  });

  const { amountMessage, isStellarMultisignBlocked } = useAmountScreenMessage({
    status,
    accountCurrency,
    amountComputationPending,
    hasRawAmount: amountReviewCore.hasRawAmount,
  });

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
  });

  const onSelectFeeStrategyWithTracking = useCallback(
    (strategy: string) => {
      track("button_clicked", {
        button: `fee ${strategy}`,
        page: "step amount",
        ...sendFlowTrackingProperties,
      });
      networkFees.onSelectFeeStrategy(strategy);
    },
    [networkFees, sendFlowTrackingProperties],
  );

  const onOpenCustomFees = useCallback(() => {
    track("button_clicked", {
      button: "fee custom",
      page: "step amount",
      ...sendFlowTrackingProperties,
    });
    navigation.goToStep(SEND_FLOW_STEP.CUSTOM_FEES);
  }, [navigation, sendFlowTrackingProperties]);

  const onSelectCoinControl = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.COIN_CONTROL);
  }, [navigation]);

  const trackedQuickActions = useMemo(
    () =>
      quickActions.map(action => ({
        ...action,
        onClick: () => {
          if (!action.active) {
            track("button_clicked", {
              button: action.id,
              page: "step amount",
              ...sendFlowTrackingProperties,
            });
          }
          action.onClick();
        },
      })),
    [quickActions, sendFlowTrackingProperties],
  );

  return {
    amountValue: amountInput.amountValue,
    amountInputMaxDecimalLength: amountInput.amountInputMaxDecimalLength,
    currencyText: amountInput.currencyText,
    currencyPosition: amountInput.currencyPosition,
    isInputDisabled: isStellarMultisignBlocked,
    onAmountChange: amountInput.onAmountChange,
    onToggleInputMode: amountInput.onToggleInputMode,
    toggleLabel: t("newSendFlow.switchInputMode"),
    secondaryValue: amountInput.secondaryValue,
    quickActions: trackedQuickActions,
    showQuickActions: quickActionsAvailableBalance.gt(0),
    amountMessage,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled,
    reviewLoading: amountComputationPending,
    onOpenCustomFees,
    onSelectCoinControl,
    ...networkFees,
    onSelectFeeStrategy: onSelectFeeStrategyWithTracking,
  };
}

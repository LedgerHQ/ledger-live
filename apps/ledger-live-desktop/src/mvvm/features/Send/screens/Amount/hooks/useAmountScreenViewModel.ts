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
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import type { AmountScreenViewModel } from "../types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useAmountInput } from "./useAmountInput";
import { useQuickActions } from "./useQuickActions";
import { useInitialTransactionPreparation } from "../../../hooks/useInitialTransactionPreparation";
import { useAmountScreenMessage } from "./useAmountScreenMessage";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { track } from "@shared/analytics";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { isSponsoredFeeUnaffordable } from "../../../utils/sponsoredFeeAsset";
import { FEE_PLACEHOLDER } from "LLD/features/Send/constants";
import type { SponsoredFeeAmounts } from "LLD/features/Send/types";

const PENDING_SPONSORED_FEE: SponsoredFeeAmounts["sponsored"] = {
  value: FEE_PLACEHOLDER,
  secondaryValue: null,
  originalValue: null,
};

function withoutKeys(
  record: Record<string, Error>,
  keys: readonly string[],
): Record<string, Error> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onSelectCoinControl: () => void;
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
  onSelectCoinControl,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard();
  const {
    selectedFeeOptionId,
    sponsoredFeeOptionId,
    providerName,
    waivesErrorKeys,
    waivesWarningKeys,
    available,
    quote,
    intentReady,
    sponsoredFeeAmounts,
    savingsFiatFormatted,
    feeCurrencyTicker,
    feeTokenAccount,
  } = useSponsoredSend();
  const sponsoredSelected = selectedFeeOptionId === sponsoredFeeOptionId;

  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  const sponsoredCoversNativeFee = sponsoredSelected && available && !!quote;
  const statusWithoutWaived = useMemo(() => {
    const waivesAny =
      waivesErrorKeys.some(key => status.errors?.[key]) ||
      waivesWarningKeys.some(key => status.warnings?.[key]);
    if (!sponsoredCoversNativeFee || !waivesAny) {
      return status;
    }
    return {
      ...status,
      errors: withoutKeys(status.errors, waivesErrorKeys),
      warnings: withoutKeys(status.warnings, waivesWarningKeys),
    };
  }, [sponsoredCoversNativeFee, waivesErrorKeys, waivesWarningKeys, status]);

  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status: statusWithoutWaived,
    bridgePending,
    transactionActions,
    labels: {
      reviewCta: t("newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("newSendFlow.getCta", { currency }),
    },
  });

  const {
    mainAccount,
    updateTransactionWithPatch,
    maxAvailable,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled,
    amountComputationPending,
    shouldPrepare,
  } = amountReviewCore;

  const sponsoredFeeUnaffordable = useMemo(() => {
    if (!sponsoredSelected || !available || !quote) return false;
    return isSponsoredFeeUnaffordable({
      account,
      transaction,
      feeTokenAccount,
      rentValue: quote.value,
    });
  }, [sponsoredSelected, available, quote, account, transaction, feeTokenAccount]);

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
    // Coins drawing from several pools (ex: Zcash transparent vs shielded) spend only the
    // pool picked on the balance-type step, so the ratios apply to it and not to the
    // account total, which sums pools the transaction cannot touch.
    const selectedPoolBalance = getSelectedBalanceTypeBalance(account, transaction);
    if (selectedPoolBalance) return selectedPoolBalance;
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account, transaction]);

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

  const { amountMessage, isAmountInputDisabled } = useAmountScreenMessage({
    status: statusWithoutWaived,
    hasRawAmount: amountReviewCore.hasRawAmount,
  });

  const onOpenCustomFees = useCallback(() => {
    track("button_clicked", {
      button: "fee custom",
      page: "step amount",
      ...sendFlowTrackingProperties,
    });
    navigation.goToStep(SEND_FLOW_STEP.CUSTOM_FEES);
  }, [navigation, sendFlowTrackingProperties]);

  const onOpenFeePayment = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.FEE_PAYMENT);
  }, [navigation]);
  const sponsoredNudge = useMemo(() => {
    let label: string | null;
    if (sponsoredSelected) {
      label = savingsFiatFormatted
        ? t("newSendFlow.feePayment.saved", { provider: providerName })
        : null;
    } else if (savingsFiatFormatted) {
      label = t("newSendFlow.feePayment.nudge", {
        amount: savingsFiatFormatted,
        provider: providerName,
      });
    } else {
      // Offered even without a saving: paying in the fee asset can be what makes the send possible.
      label = t("newSendFlow.feePayment.payIn", { feeCurrency: feeCurrencyTicker });
    }
    return {
      available,
      selected: sponsoredSelected,
      label,
      onOpen: onOpenFeePayment,
    };
  }, [
    available,
    sponsoredSelected,
    providerName,
    feeCurrencyTicker,
    savingsFiatFormatted,
    onOpenFeePayment,
    t,
  ]);

  // While the quote reloads, falling back to the standard estimate would misstate the chosen fee.
  const sponsoredFee = useMemo(
    () =>
      sponsoredSelected && available
        ? {
            ...(sponsoredFeeAmounts?.sponsored ?? PENDING_SPONSORED_FEE),
            feeAsset: feeTokenAccount
              ? { ledgerId: feeTokenAccount.token.id, ticker: feeTokenAccount.token.ticker }
              : null,
            description: t("newSendFlow.feePayment.disclaimer", {
              feeCurrency: feeCurrencyTicker,
              provider: providerName,
            }),
          }
        : null,
    [
      sponsoredSelected,
      available,
      sponsoredFeeAmounts,
      feeTokenAccount,
      feeCurrencyTicker,
      providerName,
      t,
    ],
  );

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCustomFees: onOpenCustomFees,
    onSelectCoinControl,
  });

  const trackedFeeSelectorOptions = useMemo(
    () =>
      networkFees.feeSelector.options.map(option => {
        // Only preset/default strategy picks were tracked here previously (the "fee <id>"
        // button event); custom/coinControl already carry their own tracking (onOpenCustomFees)
        // or never had tracking (onSelectCoinControl) — preserve that exactly.
        if (option.kind !== "preset" && option.kind !== "default") return option;
        return {
          ...option,
          onSelect: () => {
            track("button_clicked", {
              button: `fee ${option.id}`,
              page: "step amount",
              ...sendFlowTrackingProperties,
            });
            option.onSelect();
          },
        };
      }),
    [networkFees.feeSelector.options, sendFlowTrackingProperties],
  );

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

  // No quote while the option stays available means one is loading: every failure withdraws it.
  const sponsoredReviewNotReady = sponsoredSelected && available && (!intentReady || !quote);

  return {
    amountValue: amountInput.amountValue,
    amountInputMaxDecimalLength: amountInput.amountInputMaxDecimalLength,
    currencyText: amountInput.currencyText,
    currencyPosition: amountInput.currencyPosition,
    isInputDisabled: isAmountInputDisabled,
    onAmountChange: amountInput.onAmountChange,
    onToggleInputMode: amountInput.onToggleInputMode,
    toggleLabel: t("newSendFlow.switchInputMode"),
    secondaryValue: amountInput.secondaryValue,
    inputMode: amountInput.inputMode,
    quickActions: trackedQuickActions,
    showQuickActions: quickActionsAvailableBalance.gt(0),
    amountMessage,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled: reviewDisabled || sponsoredFeeUnaffordable || sponsoredReviewNotReady,
    sponsoredFeeError: sponsoredFeeUnaffordable
      ? t("newSendFlow.feePayment.insufficientFunds", {
          feeCurrency: feeCurrencyTicker,
          provider: providerName,
        })
      : null,
    reviewLoading: amountComputationPending || sponsoredReviewNotReady,
    ...networkFees,
    feeSelector: {
      ...networkFees.feeSelector,
      options: trackedFeeSelectorOptions,
    },
    sponsoredNudge,
    sponsoredFee,
  };
}

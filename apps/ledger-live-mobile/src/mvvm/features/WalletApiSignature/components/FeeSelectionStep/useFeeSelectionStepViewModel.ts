import { useCallback, useEffect, useMemo, useState } from "react";
import { track, trackPage } from "@shared/analytics";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getSendUiConfig } from "@ledgerhq/live-common/flows/send/uiConfig";
import { useNetworkFeesCore } from "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  buildFeeSelectorOptions,
  feeStrategySublabel,
  type FeeSelectorOption,
} from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useLocale, useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useTranslatedBridgeError } from "LLM/features/Send/screens/Recipient/hooks/useTranslatedBridgeError";
import type { SourceFlow } from "LLM/components/DeviceIntentExecutor";

const TRACKING_CATEGORY = "Wallet API sign transaction";
const TRACKING_PAGE = "fees";

const noop = () => undefined;

type Params = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
  hasFeesProvided: boolean;
  manifestId: string;
  manifestName: string;
  sourceFlow: SourceFlow;
  onOpenCustomFees: () => void;
  onConfirm: (transaction: Transaction) => void;
}>;

export type FeeSelectionStepViewModel = Readonly<{
  title: string;
  customFeesTitle: string;
  amountLabel: string;
  amount: string | null;
  totalLabel: string;
  total: string | null;
  feeOptions: readonly FeeSelectorOption[];
  error: string | null;
  isPreparing: boolean;
  continueLabel: string;
  canContinue: boolean;
  onContinue: () => void;
  /** Shared with the custom fees form, which edits the same transaction. */
  customFees: Readonly<{
    account: AccountLike;
    parentAccount: Account | null;
    transaction: Transaction;
    status: TransactionStatus;
    transactionActions: SendFlowTransactionActions;
  }>;
}>;

function firstError(status: TransactionStatus, bridgeError: Error | null | undefined) {
  return Object.values(status.errors ?? {})[0] ?? bridgeError ?? undefined;
}

/**
 * Lets the user review and edit the fees of a Wallet API transaction before the device step.
 * Every fee change re-runs `prepareTransaction` through `useBridgeTransaction`, so the amount and
 * total follow the chosen fees, and the transaction handed to `onConfirm` is the prepared one.
 */
export function useFeeSelectionStepViewModel({
  account,
  parentAccount,
  transaction: initialTransaction,
  hasFeesProvided,
  manifestId,
  manifestName,
  sourceFlow,
  onOpenCustomFees,
  onConfirm,
}: Params): FeeSelectionStepViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatUnit = counterValueCurrency.units[0];
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount),
    [account, parentAccount],
  );
  const mainCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountCurrency = useMemo(() => getAccountCurrency(account), [account]);
  const mainUnit = useMaybeAccountUnit(mainAccount) ?? mainCurrency.units[0];
  const amountUnit = useMaybeAccountUnit(account) ?? accountCurrency.units[0];
  const uiConfig = useMemo(() => getSendUiConfig(accountCurrency), [accountCurrency]);

  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const {
    transaction: bridgeTransaction,
    setTransaction,
    updateTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction<Transaction>(bridge, () => ({
    account: mainAccount,
    transaction: initialTransaction,
  }));
  const transaction = bridgeTransaction ?? initialTransaction;

  // The live app's fees stay selected until the user picks other ones.
  const [hasChangedFees, setHasChangedFees] = useState(false);
  const keepsProvidedFees = hasFeesProvided && !hasChangedFees;

  const updateTransactionByUser = useCallback(
    (updater: (tx: Transaction) => Transaction) => {
      setHasChangedFees(true);
      updateTransaction(updater);
    },
    [updateTransaction],
  );

  const transactionActions = useMemo<SendFlowTransactionActions>(
    () => ({
      setTransaction,
      updateTransaction: updateTransactionByUser,
      setRecipient: noop,
      setAccount: noop,
      updateAccount: noop,
    }),
    [setTransaction, updateTransactionByUser],
  );

  // Gas presets (EVM `gasOptions`) come from these effects, as on the Send amount screen.
  const flowEffects = useFlowEffects({
    account,
    parentAccount: parentAccount ?? null,
    transaction,
    currency: mainCurrency,
    updateTransaction,
  });

  const core = useNetworkFeesCore({
    account,
    parentAccount: parentAccount ?? null,
    transaction,
    status,
    uiConfig,
    transactionActions,
    fiatUnit,
    accountUnit: mainUnit,
    locale,
    displayMode: uiConfig.hasFiatAmountInput ? "fiat" : "crypto",
    calculateCountervalue,
  });

  const trackingProperties = useMemo(
    () => ({
      flow: sourceFlow,
      manifestId,
      manifestName,
      currency: accountCurrency.id,
      hasFeesProvided,
    }),
    [accountCurrency.id, hasFeesProvided, manifestId, manifestName, sourceFlow],
  );

  useEffect(() => {
    trackPage({ category: TRACKING_CATEGORY, name: TRACKING_PAGE, props: trackingProperties });
  }, [trackingProperties]);

  const { onSelectFeeStrategyId: selectFeeStrategyId } = core;
  const onSelectFeeStrategyId = useCallback(
    (id: string) => {
      track("button_clicked", { ...trackingProperties, page: TRACKING_PAGE, button: id });
      selectFeeStrategyId(id);
    },
    [selectFeeStrategyId, trackingProperties],
  );

  const handleOpenCustomFees = useCallback(() => {
    track("button_clicked", { ...trackingProperties, page: TRACKING_PAGE, button: "custom" });
    onOpenCustomFees();
  }, [onOpenCustomFees, trackingProperties]);

  const shouldShowFeeRateLegend = sendFeatures.hasFeeRateLegend(mainCurrency);

  const feeOptions = useMemo(
    () =>
      buildFeeSelectorOptions({
        strategyOptions: core.feeStrategyOptions,
        selectedFeeStrategyId: core.selectedFeeStrategyId,
        onSelectFeeStrategyId,
        labelFor: option =>
          t(option.kind === "default" ? "send.fees.defaultNetworkFee" : `send.fees.${option.id}`),
        sublabelFor: option =>
          feeStrategySublabel(option, { preferLegend: shouldShowFeeRateLegend }),
        custom: {
          enabled: core.hasCustomFees,
          label: keepsProvidedFees
            ? t("walletApiSignTransaction.fees.providedByApp", { appName: manifestName })
            : t("send.fees.customFees"),
          onSelect: handleOpenCustomFees,
        },
      }).map(option =>
        option.kind === "custom" && option.selected
          ? { ...option, sublabel: core.feesRowValue }
          : option,
      ),
    [
      core.feeStrategyOptions,
      core.feesRowValue,
      core.hasCustomFees,
      core.selectedFeeStrategyId,
      handleOpenCustomFees,
      keepsProvidedFees,
      manifestName,
      onSelectFeeStrategyId,
      shouldShowFeeRateLegend,
      t,
    ],
  );

  const amount = useMemo(
    () =>
      status.amount.gt(0)
        ? formatCurrencyUnit(amountUnit, status.amount, { showCode: true, locale })
        : null,
    [amountUnit, locale, status.amount],
  );

  // A token transfer spends the token and pays fees in the native coin: there is no single total.
  const total = useMemo(
    () =>
      account.type === "Account"
        ? formatCurrencyUnit(mainUnit, status.totalSpent, { showCode: true, locale })
        : null,
    [account.type, locale, mainUnit, status.totalSpent],
  );

  const translatedError = useTranslatedBridgeError(firstError(status, bridgeError));
  const isPreparing = bridgePending || flowEffects.loading;
  const canContinue = !isPreparing && !translatedError && !!bridgeTransaction;

  const onContinue = useCallback(() => {
    if (!canContinue || !bridgeTransaction) return;
    track("button_clicked", {
      ...trackingProperties,
      page: TRACKING_PAGE,
      button: "continue",
      feesStrategy: keepsProvidedFees ? "provided" : core.selectedFeeStrategyId,
    });
    onConfirm(bridgeTransaction);
  }, [
    bridgeTransaction,
    canContinue,
    core.selectedFeeStrategyId,
    keepsProvidedFees,
    onConfirm,
    trackingProperties,
  ]);

  return {
    title: t("send.fees.title"),
    customFeesTitle: t("send.fees.customFees"),
    amountLabel: t("walletApiSignTransaction.fees.amount"),
    amount,
    totalLabel: t("walletApiSignTransaction.fees.total"),
    total,
    feeOptions,
    error: translatedError?.title ?? null,
    isPreparing,
    continueLabel: t("walletApiSignTransaction.fees.continue"),
    canContinue,
    onContinue,
    customFees: {
      account,
      parentAccount: parentAccount ?? null,
      transaction,
      status,
      transactionActions,
    },
  };
}

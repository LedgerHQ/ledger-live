import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEND_FLOW_STEP, type SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useLLDCoinFamily } from "~/renderer/families";
import { trackPage } from "@shared/analytics";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";

type FlowTransaction = NonNullable<SendFlowState["transaction"]["transaction"]>;

const UNKNOWN_BALANCE = "-";

export type BalanceTypeOption = {
  id: string;
  /** i18n key suffix under `newSendFlow.`, owned by the currency's send descriptor. */
  translationKey: string;
  formattedBalance: string;
  formattedCounterValue: string;
  isZero: boolean;
  hasPendingBalance: boolean;
  icon: "lock" | "check";
};

export type BalanceTypeScreenViewModel =
  | { ready: false }
  | {
      ready: true;
      selectedOptionId: string | null;
      options: readonly BalanceTypeOption[];
      onSelect: (optionId: string) => void;
      sync: Readonly<{
        isPending: boolean;
        onComplete: () => void;
        onCancel: () => void;
      }>;
    };

export function useBalanceTypeScreenViewModel(): BalanceTypeScreenViewModel {
  const { state } = useSendFlowData();
  const { transaction: transactionActions, resetRecipient } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;
  const [isSyncPending, setIsSyncPending] = useState(false);

  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;
  const hasBalanceTypeSync = Boolean(
    useLLDCoinFamily(mainAccount?.currency.family).SendBalanceTypeSync,
  );

  const bridge = useAccountBridgeOrNull<FlowTransaction>(account);
  const unit = useMaybeAccountUnit(account ?? undefined);
  const trackingProperties = useSendFlowTrackingProperties();

  const balanceTypeConfig = useMemo(
    () => (account ? sendFeatures.getBalanceTypeConfig(getAccountCurrency(account)) : null),
    [account],
  );

  const isReady = Boolean(account && transaction && bridge && balanceTypeConfig);
  const hasTrackedRef = useRef(false);
  // A render can be discarded or retried without committing (StrictMode, a concurrent
  // interruption); running only in an effect guarantees the page event fires at most once,
  // and only after this screen actually mounted -- see useRecipientScreenViewModel's
  // equivalent tracking effect for the sibling convention this follows.
  useEffect(() => {
    if (hasTrackedRef.current || !isReady) return;
    hasTrackedRef.current = true;
    trackPage({ category: "Modal send - step balance type", props: trackingProperties });
  }, [isReady, trackingProperties]);

  const onSelect = useCallback(
    (optionId: string) => {
      if (!account || !transaction || !bridge || !balanceTypeConfig) return;
      if (!balanceTypeConfig.getOptions({ account }).some(option => option.id === optionId)) {
        return;
      }

      const poolChanged = balanceTypeConfig.getSelectedOptionId(transaction) !== optionId;
      if (poolChanged) {
        resetRecipient();
      }

      transactionActions.updateTransaction(currentTransaction =>
        bridge.updateTransaction(
          currentTransaction,
          balanceTypeConfig.buildSelectionPatch(
            optionId,
            currentTransaction,
          ) as Partial<FlowTransaction>,
        ),
      );
      if (hasBalanceTypeSync) {
        setIsSyncPending(true);
        return;
      }
      navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
    },
    [
      account,
      transaction,
      transactionActions,
      resetRecipient,
      bridge,
      balanceTypeConfig,
      navigation,
      hasBalanceTypeSync,
    ],
  );

  const onSyncComplete = useCallback(() => {
    setIsSyncPending(false);
    navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
  }, [navigation]);

  const onSyncCancel = useCallback(() => setIsSyncPending(false), []);

  if (!account || !transaction || !bridge || !balanceTypeConfig) {
    return { ready: false };
  }

  const options = balanceTypeConfig.getOptions({ account }).map(option => {
    const { balance } = option;
    const counterValue = balance
      ? calculateCountervalue(getAccountCurrency(account), balance)
      : null;

    let formattedBalance = UNKNOWN_BALANCE;
    if (balance) {
      formattedBalance = unit
        ? formatCurrencyUnit(unit, balance, { showCode: true, locale, discreet })
        : "";
    }

    return {
      id: option.id,
      translationKey: option.translationKey,
      formattedBalance,
      formattedCounterValue: counterValue
        ? formatCurrencyUnit(counterValueCurrency.units[0], counterValue, {
            showCode: true,
            locale,
            discreet,
          })
        : "",
      isZero: balance?.isZero() ?? false,
      hasPendingBalance: option.hasPendingBalance,
      icon: option.icon,
    };
  });

  return {
    ready: true,
    selectedOptionId: balanceTypeConfig.getSelectedOptionId(transaction),
    options,
    onSelect,
    sync: {
      isPending: isSyncPending,
      onComplete: onSyncComplete,
      onCancel: onSyncCancel,
    },
  };
}

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { trackPage } from "@shared/analytics";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { ScreenName } from "~/const";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import type { SendFlowNavigationProp } from "../../../types";

type FlowTransaction = NonNullable<SendFlowState["transaction"]["transaction"]>;

const UNKNOWN_BALANCE = "-";

export type BalanceTypeOption = Readonly<{
  id: string;
  translationKey: string;
  formattedBalance: string;
  formattedCounterValue: string;
  isZero: boolean;
  requiresSync: boolean;
  hasPendingBalance: boolean;
  icon: "lock" | "check";
  hideSubtitle?: boolean;
}>;

export type BalanceTypeScreenViewModel =
  | Readonly<{ ready: false }>
  | Readonly<{
      ready: true;
      selectedOptionId: string | null;
      options: readonly BalanceTypeOption[];
      onSelect: (optionId: string) => void;
    }>;

export function useBalanceTypeScreenViewModel(): BalanceTypeScreenViewModel {
  const { state } = useSendFlowData();
  const { transaction: transactionActions, resetRecipient } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  const bridge = useAccountBridgeOrNull<FlowTransaction>(account, parentAccount);
  const unit = useMaybeAccountUnit(account ?? undefined);
  const trackingProperties = useSendFlowTrackingProperties();

  const balanceTypeConfig = useMemo(
    () => (account ? sendFeatures.getBalanceTypeConfig(getAccountCurrency(account)) : null),
    [account],
  );

  const isReady = Boolean(account && transaction && bridge && balanceTypeConfig);
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || !isReady) return;
    hasTrackedRef.current = true;
    void trackPage({ category: "Modal send - step balance type", props: trackingProperties });
  }, [isReady, trackingProperties]);

  const onSelect = useCallback(
    (optionId: string) => {
      if (!account || !transaction || !bridge || !balanceTypeConfig) return;

      const optionIds = balanceTypeConfig.getOptions({ account }).map(option => option.id);
      if (!optionIds.includes(optionId)) return;

      const poolChanged = balanceTypeConfig.getSelectedOptionId(transaction) !== optionId;
      if (poolChanged) {
        resetRecipient();
        transactionActions.updateTransaction(currentTransaction => {
          return bridge.updateTransaction(
            currentTransaction,
            balanceTypeConfig.buildSelectionPatch(optionId) as Partial<FlowTransaction>,
          );
        });
      }

      navigation.navigate(ScreenName.SendFlowRecipient);
    },
    [
      account,
      transaction,
      bridge,
      balanceTypeConfig,
      resetRecipient,
      transactionActions,
      navigation,
    ],
  );

  if (!account || !transaction || !bridge || !balanceTypeConfig) {
    return {
      ready: false,
    };
  }

  const currency = getAccountCurrency(account);
  const options = balanceTypeConfig.getOptions({ account }).map(option => {
    const { balance } = option;
    const counterValue = balance ? calculateCountervalue(currency, balance) : null;

    let formattedBalance = UNKNOWN_BALANCE;
    if (balance) {
      formattedBalance = unit
        ? formatCurrencyUnit(unit, balance, { showCode: true, locale, discreet })
        : "";
    }

    return {
      formattedBalance,
      id: option.id,
      translationKey: option.translationKey,
      isZero: balance?.isZero() ?? false,
      requiresSync: balance === null,
      hasPendingBalance: option.hasPendingBalance,
      icon: option.icon,
      hideSubtitle: option.hideSubtitle,
      formattedCounterValue: counterValue
        ? formatCurrencyUnit(counterValueCurrency.units[0], counterValue, {
            showCode: true,
            locale,
            discreet,
          })
        : "",
    };
  });

  return {
    options,
    onSelect,
    ready: true,
    selectedOptionId: balanceTypeConfig.getSelectedOptionId(transaction),
  };
}

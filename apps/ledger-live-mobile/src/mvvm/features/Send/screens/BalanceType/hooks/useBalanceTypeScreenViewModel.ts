import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { trackPage } from "@shared/analytics";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { ScreenName } from "~/const";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { isSendBalanceTypeSyncRequired } from "../../../utils/familySendSlots";
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
  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;

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
      if (!account || !mainAccount || !transaction || !bridge || !balanceTypeConfig) return;
      if (!balanceTypeConfig.getOptions({ account }).some(option => option.id === optionId)) {
        return;
      }

      const selectionPatch = balanceTypeConfig.buildSelectionPatch(
        optionId,
      ) as Partial<FlowTransaction>;
      const poolChanged = balanceTypeConfig.getSelectedOptionId(transaction) !== optionId;
      if (poolChanged) {
        resetRecipient();
        transactionActions.updateTransaction(currentTransaction =>
          bridge.updateTransaction(currentTransaction, selectionPatch),
        );
      }

      const selectedTransaction = poolChanged
        ? bridge.updateTransaction(transaction, selectionPatch)
        : transaction;
      navigation.navigate(
        isSendBalanceTypeSyncRequired(mainAccount, selectedTransaction)
          ? ScreenName.SendFlowBalanceTypeSync
          : ScreenName.SendFlowRecipient,
      );
    },
    [
      account,
      mainAccount,
      transaction,
      bridge,
      balanceTypeConfig,
      resetRecipient,
      transactionActions,
      navigation,
    ],
  );

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
      requiresSync: balance === null,
      hasPendingBalance: option.hasPendingBalance,
      icon: option.icon,
      hideSubtitle: option.hideSubtitle,
    };
  });

  return {
    ready: true,
    selectedOptionId: balanceTypeConfig.getSelectedOptionId(transaction),
    options,
    onSelect,
  };
}

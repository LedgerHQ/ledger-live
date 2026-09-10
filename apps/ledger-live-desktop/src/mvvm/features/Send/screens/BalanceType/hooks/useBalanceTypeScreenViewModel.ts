import { useCallback, useMemo } from "react";
import { SEND_FLOW_STEP, type SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "LLD/hooks/redux";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

type FlowTransaction = NonNullable<SendFlowState["transaction"]["transaction"]>;

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
    };

export function useBalanceTypeScreenViewModel(): BalanceTypeScreenViewModel {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const { account } = state.account;
  const { transaction } = state.transaction;

  const bridge = useAccountBridgeOrNull<FlowTransaction>(account);
  const unit = useMaybeAccountUnit(account ?? undefined);

  const balanceTypeConfig = useMemo(
    () => (account ? sendFeatures.getBalanceTypeConfig(getAccountCurrency(account)) : null),
    [account],
  );

  const onSelect = useCallback(
    (optionId: string) => {
      if (!transaction || !bridge || !balanceTypeConfig) return;
      transactionActions.setTransaction(
        bridge.updateTransaction(
          transaction,
          balanceTypeConfig.buildSelectionPatch(optionId) as Partial<FlowTransaction>,
        ),
      );
      navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
    },
    [transaction, transactionActions, bridge, balanceTypeConfig, navigation],
  );

  if (!account || !transaction || !bridge || !balanceTypeConfig) {
    return { ready: false };
  }

  const options = balanceTypeConfig.getOptions({ account }).map(option => {
    const counterValue = calculateCountervalue(getAccountCurrency(account), option.balance);

    return {
      id: option.id,
      translationKey: option.translationKey,
      formattedBalance: unit
        ? formatCurrencyUnit(unit, option.balance, { showCode: true, locale, discreet })
        : "",
      formattedCounterValue: counterValue
        ? formatCurrencyUnit(counterValueCurrency.units[0], counterValue, {
            showCode: true,
            locale,
            discreet,
          })
        : "",
      isZero: option.balance.isZero(),
      hasPendingBalance: option.hasPendingBalance,
      icon: option.icon,
    };
  });

  return {
    ready: true,
    selectedOptionId: balanceTypeConfig.getSelectedOptionId(transaction),
    options,
    onSelect,
  };
}

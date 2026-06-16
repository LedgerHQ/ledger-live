import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useCustomFeesViewModelCore,
  type CustomFeesViewModelLabels,
} from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import {
  getCustomFeeLabelKey,
  getCustomFeeHelperLabelKey,
} from "@ledgerhq/live-common/flows/send/customFees/utils/customFeeUtils";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export type {
  CustomFeeInputState,
  CustomFeesViewModel,
} from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";

type CustomFeesViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function useCustomFeesViewModel(
  props: CustomFeesViewModelProps,
): ReturnType<typeof useCustomFeesViewModelCore> {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const labels: CustomFeesViewModelLabels = useMemo(
    () => ({
      getInputLabel: (key, unit) => t(getCustomFeeLabelKey(key), { unit }),
      getHelperLabel: key => {
        const helperKey = getCustomFeeHelperLabelKey(key);
        return helperKey ? t(helperKey) : null;
      },
      getNetworkFeesInFiatLabel: currency =>
        t("newSendFlow.customFees.networkFeesInFiat", { currency }),
      invalidValue: t("newSendFlow.customFees.invalidValue"),
      belowMinimum: min => t("newSendFlow.customFees.belowMinimum", { min }),
      maxFeeBelowPriorityFee: t("newSendFlow.customFees.maxFeeBelowPriorityFee"),
      insufficientBalanceFees: t("newSendFlow.insufficientBalanceFees"),
      confirm: t("newSendFlow.customFees.confirm"),
      suggested: t("newSendFlow.customFees.suggested"),
      payFeesIn: t("newSendFlow.customFees.payFeesIn"),
    }),
    [t],
  );

  return useCustomFeesViewModelCore({
    ...props,
    locale,
    counterValueCurrency,
    calculateCountervalue,
    labels,
  });
}

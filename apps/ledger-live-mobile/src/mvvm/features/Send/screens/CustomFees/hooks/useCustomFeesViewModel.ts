import { useMemo } from "react";
import { useTranslation, useLocale } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useCustomFeesViewModelCore,
  type CustomFeesViewModel,
  type CustomFeesViewModelLabels,
} from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import {
  getCustomFeeLabelKey,
  getCustomFeeHelperLabelKey,
} from "@ledgerhq/live-common/flows/send/customFees/utils/customFeeUtils";
import { counterValueCurrencySelector } from "~/reducers/settings";

type UseCustomFeesViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function useCustomFeesViewModel(params: UseCustomFeesViewModelParams): CustomFeesViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const labels: CustomFeesViewModelLabels = useMemo(
    () => ({
      getInputLabel: (key, unit) => t(`send.${getCustomFeeLabelKey(key)}`, { unit }),
      getHelperLabel: key => {
        const helperKey = getCustomFeeHelperLabelKey(key);
        return helperKey ? t(`send.${helperKey}`) : null;
      },
      getNetworkFeesInFiatLabel: currency =>
        t("send.newSendFlow.customFees.networkFeesInFiat", { currency }),
      invalidValue: t("send.newSendFlow.customFees.invalidValue"),
      belowMinimum: min => t("send.newSendFlow.customFees.belowMinimum", { min }),
      maxFeeBelowPriorityFee: t("send.newSendFlow.customFees.maxFeeBelowPriorityFee"),
      insufficientBalanceFees: t("send.newSendFlow.insufficientBalanceFees"),
      confirm: t("send.newSendFlow.customFees.confirm"),
      suggested: t("send.newSendFlow.customFees.suggested"),
      payFeesIn: t("send.newSendFlow.customFees.payFeesIn"),
    }),
    [t],
  );

  return useCustomFeesViewModelCore({
    ...params,
    locale,
    counterValueCurrency,
    calculateCountervalue,
    labels,
  });
}

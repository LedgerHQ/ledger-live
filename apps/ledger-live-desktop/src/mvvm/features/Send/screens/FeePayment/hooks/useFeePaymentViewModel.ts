import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSponsoredSend, type SponsoredFeeOptionId } from "../../../context/SponsoredSendContext";

export type FeePaymentOptionId = SponsoredFeeOptionId;

export type FeePaymentOption = Readonly<{
  id: FeePaymentOptionId;
  label: string;
  /** Formatted "Save {{amount}}" sublabel; null while the quote isn't loaded yet or for the
   * standard option, which never carries a savings sublabel. */
  savingsLabel: string | null;
  selected: boolean;
}>;

export type FeePaymentViewModel = Readonly<{
  title: string;
  options: readonly FeePaymentOption[];
  disclaimer: string;
  onSelect: (id: FeePaymentOptionId) => void;
}>;

/**
 * View model for the floating FEE_PAYMENT selector: reads the single sponsored-fee source of
 * truth (SponsoredSendContext, which runs useSponsoredFee once) rather than mounting a second
 * useSponsoredFee instance here.
 */
export function useFeePaymentViewModel(): FeePaymentViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const {
    selectedFeeOptionId,
    selectTronify,
    selectStandard,
    savingsFiatFormatted,
    feeCurrencyTicker,
  } = useSponsoredSend();

  const onSelect = useCallback(
    (id: FeePaymentOptionId) => {
      if (id === "tronify") {
        selectTronify();
      } else {
        selectStandard();
      }
      navigation.goToPreviousStep();
    },
    [selectTronify, selectStandard, navigation],
  );

  const options: readonly FeePaymentOption[] = useMemo(
    () => [
      {
        id: "standard",
        label: t("newSendFlow.feePayment.regular"),
        savingsLabel: null,
        selected: selectedFeeOptionId === "standard",
      },
      {
        id: "tronify",
        label: t("newSendFlow.feePayment.tronify"),
        savingsLabel: savingsFiatFormatted
          ? t("newSendFlow.feePayment.savings", { amount: savingsFiatFormatted })
          : null,
        selected: selectedFeeOptionId === "tronify",
      },
    ],
    [t, selectedFeeOptionId, savingsFiatFormatted],
  );

  return {
    title: t("newSendFlow.feePayment.title"),
    options,
    disclaimer: t("newSendFlow.feePayment.disclaimer", { feeCurrency: feeCurrencyTicker }),
    onSelect,
  };
}

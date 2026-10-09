import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type {
  FeePaymentLabels,
  FeePaymentOption,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFeePaymentOptions } from "@ledgerhq/live-common/flows/send/sponsored/useFeePaymentOptions";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type FeePaymentViewModel = Readonly<{
  options: readonly FeePaymentOption[];
  disclaimer: string;
  learnMoreLabel: string;
  learnMoreUrl: string;
  onLearnMore: () => void;
  confirmLabel: string;
  confirmDisabled: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}>;

export function useFeePaymentViewModel(): FeePaymentViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state } = useSendFlowData();
  const sponsoredSend = useSponsoredSend();
  const { providerName, feeCurrencyTicker } = sponsoredSend;
  const { account, parentAccount } = state.account;
  const nativeTicker = account ? getMainAccount(account, parentAccount).currency.ticker : "";

  const labels: FeePaymentLabels = useMemo(
    () => ({
      sponsored: t("newSendFlow.feePayment.sponsored", { provider: providerName }),
      sponsoredPaidIn: t("newSendFlow.feePayment.paidIn", { currency: feeCurrencyTicker }),
      regular: t("newSendFlow.feePayment.regular"),
      regularPaidIn: t("newSendFlow.feePayment.paidIn", { currency: nativeTicker }),
      insufficientFunds: t("newSendFlow.feePayment.insufficientFunds", {
        feeCurrency: feeCurrencyTicker,
        provider: providerName,
      }),
    }),
    [t, providerName, feeCurrencyTicker, nativeTicker],
  );
  const { options, confirmDisabled, onSelect, confirm } = useFeePaymentOptions({
    ...sponsoredSend,
    labels,
  });

  const onConfirm = useCallback(() => {
    if (confirm()) navigation.goToPreviousStep();
  }, [confirm, navigation]);

  const learnMoreUrl = useLocalizedUrl(urls.gasSponsorship);
  const onLearnMore = useCallback(() => {
    if (learnMoreUrl) openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return {
    options,
    disclaimer: t("newSendFlow.feePayment.disclaimer", {
      feeCurrency: feeCurrencyTicker,
      provider: providerName,
    }),
    learnMoreLabel: t("common.learnMore"),
    learnMoreUrl,
    onLearnMore,
    confirmLabel: t("newSendFlow.feePayment.confirm"),
    confirmDisabled,
    onSelect,
    onConfirm,
  };
}

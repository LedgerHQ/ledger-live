import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { track } from "@shared/analytics";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend, STANDARD_FEE_OPTION_ID } from "../../../context/SponsoredSendContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getSendFlowTrackingPage } from "../../../utils/contactTracking";
import type { FeeAmountDisplay } from "LLD/features/Send/types";

export type FeePaymentOption = Readonly<{
  id: string;
  label: string;
  paidInLabel: string;
  fee:
    | (FeeAmountDisplay &
        Readonly<{
          /** The standard fee's fiat price, struck through before `value`; null when not comparable. */
          originalValue: string | null;
        }>)
    | null;
  selected: boolean;
  disabled: boolean;
  /** Why the option can't be picked; null while it can. */
  note: string | null;
}>;

export type FeePaymentViewModel = Readonly<{
  options: readonly FeePaymentOption[];
  disclaimer: string;
  confirmLabel: string;
  confirmDisabled: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}>;

export function useFeePaymentViewModel(): FeePaymentViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state } = useSendFlowData();
  const {
    selectedFeeOptionId,
    sponsoredFeeOptionId,
    providerName,
    selectSponsored,
    selectStandard,
    sponsoredFeeAmounts,
    feeCurrencyTicker,
    feeTokenAccount,
    sponsoredMaxAmount,
  } = useSponsoredSend();
  const sponsoredDisabled = !feeTokenAccount || !!sponsoredMaxAmount?.lte(0);
  const { account, parentAccount } = state.account;
  const nativeTicker = account ? getMainAccount(account, parentAccount).currency.ticker : "";
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const { flowSessionId } = useSendFlowTracking();

  const [pendingId, setPendingId] = useState(selectedFeeOptionId);
  const pendingUnavailable = pendingId === sponsoredFeeOptionId && sponsoredDisabled;

  const onSelect = useCallback(
    (id: string) => {
      if (id === sponsoredFeeOptionId && sponsoredDisabled) return;
      setPendingId(id);
    },
    [sponsoredFeeOptionId, sponsoredDisabled],
  );

  const onConfirm = useCallback(() => {
    if (pendingUnavailable) return;
    track("button_clicked", {
      button: "confirm",
      page: getSendFlowTrackingPage(SEND_FLOW_STEP.FEE_PAYMENT),
      fee_option: pendingId,
      flow_session_id: flowSessionId,
      ...sendFlowTrackingProperties,
    });
    if (pendingId !== selectedFeeOptionId) {
      if (pendingId === sponsoredFeeOptionId) {
        selectSponsored();
      } else {
        selectStandard();
      }
    }
    navigation.goToPreviousStep();
  }, [
    pendingUnavailable,
    pendingId,
    selectedFeeOptionId,
    sponsoredFeeOptionId,
    selectSponsored,
    selectStandard,
    navigation,
    flowSessionId,
    sendFlowTrackingProperties,
  ]);

  const options: readonly FeePaymentOption[] = useMemo(
    () => [
      {
        id: sponsoredFeeOptionId,
        label: t("newSendFlow.feePayment.sponsored", { provider: providerName }),
        paidInLabel: t("newSendFlow.feePayment.paidIn", { currency: feeCurrencyTicker }),
        fee: sponsoredFeeAmounts?.sponsored ?? null,
        selected: pendingId === sponsoredFeeOptionId,
        disabled: sponsoredDisabled,
        note: sponsoredDisabled
          ? t("newSendFlow.feePayment.insufficientFunds", {
              feeCurrency: feeCurrencyTicker,
              provider: providerName,
            })
          : null,
      },
      {
        id: STANDARD_FEE_OPTION_ID,
        label: t("newSendFlow.feePayment.regular"),
        paidInLabel: t("newSendFlow.feePayment.paidIn", { currency: nativeTicker }),
        fee: sponsoredFeeAmounts ? { ...sponsoredFeeAmounts.standard, originalValue: null } : null,
        selected: pendingId === STANDARD_FEE_OPTION_ID,
        disabled: false,
        note: null,
      },
    ],
    [
      t,
      pendingId,
      sponsoredFeeOptionId,
      providerName,
      sponsoredFeeAmounts,
      sponsoredDisabled,
      feeCurrencyTicker,
      nativeTicker,
    ],
  );

  return {
    options,
    disclaimer: t("newSendFlow.feePayment.disclaimer", {
      feeCurrency: feeCurrencyTicker,
      provider: providerName,
    }),
    confirmLabel: t("newSendFlow.feePayment.confirm"),
    confirmDisabled: pendingUnavailable,
    onSelect,
    onConfirm,
  };
}

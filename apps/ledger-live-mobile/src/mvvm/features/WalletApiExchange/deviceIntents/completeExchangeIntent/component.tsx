import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { CompleteExchangeIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import ModalLock from "~/components/ModalLock";
import { useTranslation } from "~/context/Locale";
import { ExchangeRefusedState } from "../ExchangeRefusedState";
import { ExchangeSpinner } from "../ExchangeSpinner";
import { SwapTermsFooter } from "./SwapTermsFooter";

type CompleteExchangeIntentComponentProps = Readonly<{
  jobState: CompleteExchangeIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** Where the legacy confirmation screens kept their copy, per exchange type. */
function getConfirmationCopyKeys(exchangeType: number): { title: string; description?: string } {
  switch (exchangeType) {
    case ExchangeType.SWAP:
      return {
        title: "DeviceAction.confirmSwap.title",
        description: "DeviceAction.confirmSwap.alert.default",
      };
    case ExchangeType.SELL:
      return {
        title: "DeviceAction.confirmSell.title",
        description: "DeviceAction.confirmSell.alert",
      };
    case ExchangeType.FUND:
      return {
        title: "DeviceAction.confirmFund.title",
        description: "DeviceAction.confirmFund.alert",
      };
    default:
      return { title: "DeviceAction.confirmExchangeOnDevice" };
  }
}

export function CompleteExchangeIntentComponent({
  jobState,
  onClose,
}: CompleteExchangeIntentComponentProps) {
  const { t } = useTranslation();

  if (!jobState) {
    return <ExchangeSpinner testID="wallet-api-exchange-loading" />;
  }

  switch (jobState.type) {
    case "preparing":
    case "error":
      return <ExchangeSpinner testID="wallet-api-exchange-loading" />;
    // The user already approved the exchange: the coin app signs without asking again.
    case "confirmed":
    case "pending":
    case "device-signature-requested":
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <>
          <ModalLock />
          <ExchangeSpinner testID="wallet-api-exchange-loading" />
        </>
      );
    case "awaiting-confirmation": {
      const copy = getConfirmationCopyKeys(jobState.exchangeType);
      return (
        <Box lx={{ width: "full", alignItems: "center", gap: "s24" }}>
          <ModalLock />
          <DeviceActionContent
            action="continue"
            deviceModelId={jobState.deviceModelId}
            title={t(copy.title)}
            description={copy.description ? t(copy.description) : undefined}
            testID="wallet-api-exchange-confirm-prompt"
          />
          {jobState.exchangeType === ExchangeType.SWAP && (
            <SwapTermsFooter provider={jobState.provider} sponsored={jobState.sponsored} />
          )}
        </Box>
      );
    }
    case "refused":
      return <ExchangeRefusedState onClose={onClose} />;
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled complete exchange intent state: ${JSON.stringify(value)}`);
}

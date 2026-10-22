import React, { useMemo } from "react";
import { Linking } from "react-native";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import { sharedSwapTracking } from "~/screens/Swap/utils";
import { urls } from "~/utils/urls";
import { getExchangeErrorPresentation } from "../../errors/getExchangeErrorPresentation";

type ExchangeErrorStateProps = Readonly<{
  error: Error;
  onClose: () => void;
}>;

/** Never spread the error itself: some carry wallet addresses (`AddressesSanctionedError`). */
function getErrorTrackingProperties(error: Error): { step?: string; title?: string } {
  return {
    ...("step" in error && typeof error.step === "string" ? { step: error.step } : {}),
    ...("title" in error && typeof error.title === "string" ? { title: error.title } : {}),
  };
}

/**
 * Tells the user an exchange failed, in the executor's own sheet. There is no retry: the Exchange
 * app has already used its nonce, so the exchange starts over from the live app.
 */
export function ExchangeErrorState({ error, onClose }: ExchangeErrorStateProps) {
  const { t } = useTranslation();
  const contactSupportUrl = useLocalizedUrl(urls.contact);

  const { title, description, swapCode, correlationId } = useMemo(
    () => getExchangeErrorPresentation(error, t),
    [error, t],
  );

  // What support needs to find the failure: the step that failed, and the request in the backend.
  const details = [
    swapCode ? `${t("swapErrors.details.code")}: ${swapCode}` : null,
    correlationId ? `${t("swapErrors.details.correlationId")}: ${correlationId}` : null,
  ].filter((line): line is string => line !== null);
  const [detailsTitle, ...otherDetails] = details;

  return (
    <>
      <TrackScreen
        category="Swap"
        name="Swap Error Screen"
        {...sharedSwapTracking}
        {...getErrorTrackingProperties(error)}
      />
      <InfoState
        preset="error"
        size="hug"
        title={title}
        description={description}
        banner={
          detailsTitle
            ? {
                title: detailsTitle,
                description: otherDetails.length > 0 ? otherDetails.join("\n") : undefined,
              }
            : undefined
        }
        primaryCta={{
          label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
          onPress: () => {
            Linking.openURL(contactSupportUrl).catch(() => undefined);
          },
          testID: "wallet-api-exchange-error-support",
        }}
        secondaryCta={{
          label: t("common.close"),
          onPress: onClose,
          testID: "wallet-api-exchange-error-close",
        }}
        testID="wallet-api-exchange-error"
      />
    </>
  );
}

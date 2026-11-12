import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "~/context/Locale";

/**
 * Shown once the user refused on the device. Unlike the signing drawer there is no retry: the
 * Exchange app has already consumed the nonce, so the exchange starts over from the live app.
 */
export function ExchangeRefusedState({
  onClose,
}: Readonly<{
  onClose: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("walletApiSignTransaction.sign.cancelled.title")}
      primaryCta={{
        label: t("walletApiSignTransaction.sign.cancelled.close"),
        onPress: onClose,
        testID: "wallet-api-exchange-refused-close",
      }}
      testID="wallet-api-exchange-refused"
    />
  );
}

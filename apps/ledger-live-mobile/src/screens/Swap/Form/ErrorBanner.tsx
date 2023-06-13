import React, { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { ValidCheckQuoteErrorCodes } from "@ledgerhq/live-common/exchange/swap/types";
import { urls } from "../../../config/urls";
import { Banner } from "./Banner";

export function ErrorBanner({
  provider,
  errorCode,
}: {
  provider: string;
  errorCode: ValidCheckQuoteErrorCodes;
}) {
  const { t } = useTranslation();

  const onPress = useCallback(() => {
    // @ts-expect-error something wrong with providers type
    Linking.openURL(urls.swap.providers[provider]?.support);
  }, [provider]);

  const message = useMemo(() => {
    switch (errorCode) {
      case "WITHDRAWALS_BLOCKED": {
        return t("swap2.form.providers.withdrawalsBlockedError.message", {
          providerName: getProviderName(provider),
        });
      }
      default:
        return `${t("crash.title")} - ${errorCode}`;
    }
  }, [errorCode, provider, t]);

  return <Banner message={message} cta={t("common.getSupport")} onPress={onPress} />;
}

import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import SectionInformative from "~/renderer/screens/exchange/Swap2/Form/FormSummary/SectionInformative";
const FormErrorBanner = ({ provider, error }: { provider?: string; error: string }) => {
  const { t } = useTranslation();
  const openProviderSupport = useCallback(() => {
    if (!provider) {
      return;
    }
    openURL(urls.swap.providers[provider]?.support);
  }, [provider]);
  if (!provider) return null;
  const ctaLabel = t("common.getSupport");
  let message = `${t("crash.title")} - ${error}`;
  switch (error) {
    case "WITHDRAWALS_BLOCKED": {
      message = t("swap2.form.providers.withdrawalsBlockedError.message", {
        providerName: getProviderName(provider),
      });
      break;
    }
    default:
      break;
  }
  return <SectionInformative message={message} ctaLabel={ctaLabel} onClick={openProviderSupport} />;
};
export default FormErrorBanner;

// @flow
import type { KYCStatus } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getProviderName, KYC_STATUS } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import SectionInformative from "~/renderer/screens/exchange/Swap2/Form/FormSummary/SectionInformative";

const FormKYCBanner = ({
  provider,
  status,
  onClick,
}: {
  provider?: string,
  status?: KYCStatus,
  onClick: Function,
}) => {
  const { t } = useTranslation();

  const openProviderSupport = useCallback(() => {
    if (!provider) {
      return;
    }
    openURL(urls.swap.providers[provider]?.support);
  }, [provider]);

  // we render the component only if KYC is rejected or need to be upgraded
  // i.e: we don't render it if the KYC is "pending".
  if (!provider || (status && status === KYC_STATUS.pending)) return null;

  let onClickAction = onClick;

  let { message, cta } = (() => {
    switch (status) {
      case KYC_STATUS.rejected:
        return {
          message: t("swap2.form.providers.kyc.rejected"),
          cta: t("swap2.form.providers.kyc.update"),
        };

      case KYC_STATUS.upgradeRequired:
        return {
          message: t("swap2.form.providers.kyc.updateRequired"),
          cta: t("swap2.form.providers.kyc.complete"),
        };

      // If the status is _undefined_, this means the user has not yet completed KYC (for Wyre only)
      default:
        return {
          message: t("swap2.form.providers.kyc.required"),
          cta: t("swap2.form.providers.kyc.complete"),
        };
    }
  })();

  /**
   * For FTX, the user needs to contact FTX support if his KYC has been rejected
   * This is specific partner logic
   */
  if (["ftx", "ftxus"].includes(provider) && status === KYC_STATUS.rejected) {
    message = t("swap2.form.providers.kyc.rejectedContactProviderSupport", {
      providerName: getProviderName(provider),
    });
    cta = t("common.getSupport");
    onClickAction = openProviderSupport;
  }

  return <SectionInformative message={message} ctaLabel={cta} onClick={onClickAction} />;
};

export default FormKYCBanner;

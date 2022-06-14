// @flow
import type { KYCStatus } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { KYC_STATUS } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import React from "react";
import { useTranslation } from "react-i18next";
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

  // we render the component only if KYC is rejected or need to be upgraded
  // i.e: we don't render it if the KYC is "pending".
  if (!provider || (status && status === KYC_STATUS.pending)) return null;

  const { message, cta } = (() => {
    switch (status) {
      case KYC_STATUS.rejected:
        return {
          message: "swap2.form.providers.kyc.rejected",
          cta: "swap2.form.providers.kyc.update",
        };

      case KYC_STATUS.upgradeRequired:
        return {
          message: "swap2.form.providers.kyc.updateRequired",
          cta: "swap2.form.providers.kyc.complete",
        };

      // If the status is _undefined_, this means the user has not yet completed KYC (for Wyre only)
      default:
        return {
          message: "swap2.form.providers.kyc.required",
          cta: "swap2.form.providers.kyc.complete",
        };
    }
  })();

  return <SectionInformative message={t(message)} ctaLabel={t(cta)} onClick={onClick} />;
};

export default FormKYCBanner;

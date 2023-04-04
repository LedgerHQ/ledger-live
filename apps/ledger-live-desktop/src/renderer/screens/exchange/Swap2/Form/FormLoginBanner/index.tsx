import React from "react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import SectionInformative from "~/renderer/screens/exchange/Swap2/Form/FormSummary/SectionInformative";
import { useGetSwapTrackingProperties } from "../../utils/index";
const FormLoginBanner = ({ provider, onClick }: { provider?: string; onClick: Function }) => {
  const { t } = useTranslation();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  if (!provider) return null;
  const { message, cta } = {
    message: t("swap2.form.providers.login.required"),
    cta: t("swap2.form.providers.login.complete"),
  };
  const onClickAndTrack = () => {
    track("button_clicked", {
      button: "Login",
      page: "Page Swap Form",
      partner: provider,
      ...swapDefaultTrack,
    });
    onClick();
  };
  return <SectionInformative message={message} ctaLabel={cta} onClick={onClickAndTrack} />;
};
export default FormLoginBanner;

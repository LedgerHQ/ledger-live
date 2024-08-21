import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export default function PinCodeErrorStep() {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const title = "walletSync.synchronize.pinCode.error.title";
  const desc = "walletSync.synchronize.pinCode.error.description";

  return (
    <Error
      title={t(title)}
      description={t(desc)}
      analyticsPage={AnalyticsPage.PinCodeError}
      cta={t("common.tryAgain")}
      onClick={() =>
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }))
      }
    />
  );
}

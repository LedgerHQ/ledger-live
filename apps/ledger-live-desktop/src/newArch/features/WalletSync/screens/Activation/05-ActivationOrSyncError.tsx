import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export default function ErrorStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const title = "walletSync.error.title";
  const desc = "walletSync.error.description";
  const cta = "walletSync.error.cta";

  const tryAgain = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  };
  return <Error title={t(title)} description={t(desc)} onClick={tryAgain} cta={t(cta)} />;
}

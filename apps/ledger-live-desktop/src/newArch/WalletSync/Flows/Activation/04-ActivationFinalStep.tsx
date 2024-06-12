import React from "react";
//import { Error } from "../../components/Error";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

type Props = {
  isNewBackup: boolean;
};

export default function ActivationFinalStep({ isNewBackup }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const title = isNewBackup ? "walletSync.success.backup.title" : "walletSync.success.synch.title";
  const desc = isNewBackup ? "walletSync.success.backup.desc" : "walletSync.success.synch.desc";
  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
  };
  return <Success title={t(title)} description={t(desc)} withCta onClick={goToSync} />;
}

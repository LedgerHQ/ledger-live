import React from "react";
//import { Error } from "../../components/Error";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";

type Props = {
  hasBackup: boolean;
};

export default function ActivationFinalStep({ hasBackup }: Props) {
  const { t } = useTranslation();
  const title = !hasBackup ? "walletSync.success.backup.title" : "walletSync.success.synch.title";
  const desc = !hasBackup ? "walletSync.success.backup.desc" : "walletSync.success.synch.desc";
  return <Success title={t(title)} description={t(desc)} withCta={!hasBackup} />;
}

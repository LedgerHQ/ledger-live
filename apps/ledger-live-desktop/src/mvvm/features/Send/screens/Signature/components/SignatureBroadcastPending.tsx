import React from "react";
import { useTranslation } from "react-i18next";
import { SignatureLoading } from "./SignatureLoading";

export function SignatureBroadcastPending() {
  const { t } = useTranslation();
  return <SignatureLoading title={t("send.steps.confirmation.pending.title")} />;
}

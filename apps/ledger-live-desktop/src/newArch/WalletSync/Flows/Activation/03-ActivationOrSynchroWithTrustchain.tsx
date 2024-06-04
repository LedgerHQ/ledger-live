import React, { useCallback, useEffect } from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { UnsecuredError } from "./03-UnsecuredError";

type Props = {
  goNext: () => void;
};

export default function ActivationOrSynchroWithTrustchain({ goNext }: Props) {
  const { t } = useTranslation();

  const hasError = false;

  const stuffHandledByTrustchain = useCallback(() => {
    goNext();
  }, [goNext]);

  useEffect(() => {
    setTimeout(() => {
      !hasError && stuffHandledByTrustchain();
    }, 3000);
  }, [hasError, stuffHandledByTrustchain]);

  return hasError ? (
    <UnsecuredError />
  ) : (
    <Loading title={t("walletSync.loading.title")} subtitle={t("walletSync.loading.activation")} />
  );
}

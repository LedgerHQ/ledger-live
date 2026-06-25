import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export function LoadingState(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center gap-16 px-16 py-24">
      <Spinner size={32} />
      <h3 className="heading-4-semi-bold text-center text-base">
        {t("deviceIntentExecutor.connectDevice.states.loading.title")}
      </h3>
    </div>
  );
}
